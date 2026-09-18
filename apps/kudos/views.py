from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from apps.accounts.models import User
from apps.reactions.models import Reaction, ReactionType
from .models import Kudos, PointTransaction, TransactionType, CompanyValue, KudosPoint
from .serializers import (
    KudosCreateSerializer,
    KudosReadSerializer,
    ReactionActionSerializer,
)


def compute_reaction_summary(kudo, current_user=None):
    """
    Computes a reaction summary map for a Kudo card without N+1 queries.
    """
    all_reactions = kudo.reactions.all()
    counts = {choice[0]: 0 for choice in ReactionType.choices}
    user_reactions = []

    for rx in all_reactions:
        if rx.reaction_type in counts:
            counts[rx.reaction_type] += 1
        if current_user and current_user.is_authenticated and rx.user_id == current_user.id:
            user_reactions.append(rx.reaction_type)

    return {
        "kudo_id": kudo.id,
        "reaction_counts": counts,
        "user_reactions": user_reactions,
        "total_reactions": len(all_reactions),
    }


class KudosListCreateAPIView(APIView):
    """
    Kudos Feed (GET) and Give Kudos (POST).
    """
    permission_classes = [IsAuthenticatedOrReadOnly]

    @extend_schema(
        tags=['Kudos'],
        summary="Retrieve Company Kudos Feed",
        description=(
            "Retrieves a paginated feed of kudos ordered from newest to oldest. "
            "Pre-fetches sender/receiver profiles and reactions to avoid N+1 database queries. "
            "Optimized for React infinite scroll."
        ),
        parameters=[
            OpenApiParameter(
                name='company_value',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter kudos by company value (Teamwork, CustomerObsession, Innovation)'
            ),
            OpenApiParameter(
                name='receiver_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Filter kudos received by specific user ID'
            ),
            OpenApiParameter(
                name='sender_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Filter kudos sent by specific user ID'
            ),
            OpenApiParameter(
                name='department_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Filter kudos by receiver department ID'
            ),
            OpenApiParameter(
                name='page',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Page number for infinite scroll pagination'
            ),
        ],
        responses={200: KudosReadSerializer(many=True)}
    )
    def get(self, request):
        queryset = Kudos.objects.select_related(
            'sender',
            'receiver',
            'sender__department',
            'receiver__department'
        ).prefetch_related('reactions').order_by('-created_at')

        # Query parameter filters
        company_value = request.query_params.get('company_value')
        if company_value:
            queryset = queryset.filter(company_value=company_value)

        receiver_id = request.query_params.get('receiver_id')
        if receiver_id:
            queryset = queryset.filter(receiver_id=receiver_id)

        sender_id = request.query_params.get('sender_id')
        if sender_id:
            queryset = queryset.filter(sender_id=sender_id)

        department_id = request.query_params.get('department_id')
        if department_id:
            queryset = queryset.filter(receiver__department_id=department_id)

        # DRF PageNumberPagination
        paginator = generics.GenericAPIView.pagination_class()
        paginated_queryset = paginator.paginate_queryset(queryset, request)
        serializer = KudosReadSerializer(paginated_queryset, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        tags=['Kudos'],
        summary="Give Kudos (Atomic Points Transfer)",
        description=(
            "Awards a Kudo from the authenticated sender to a peer receiver. "
            "Executes within a PostgreSQL database transaction with row-level locks (SELECT FOR UPDATE) "
            "to guarantee atomic balance deduction, point crediting, kudo record creation, and ledger logging."
        ),
        request=KudosCreateSerializer,
        responses={
            201: KudosReadSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
        }
    )
    def post(self, request):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        serializer = KudosCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        receiver_id = serializer.validated_data['receiver_id']
        points = serializer.validated_data['points']
        message = serializer.validated_data['message']
        company_value = serializer.validated_data['company_value']

        # ======================================================================
        # ATOMIC DATABASE TRANSACTION WITH ROW LOCKING
        # ======================================================================
        with transaction.atomic():
            # 1. Lock sender row to prevent concurrent race conditions
            sender = User.objects.select_for_update().get(id=request.user.id)

            # 2. Strict balance re-check under row lock
            if sender.giving_allowance < points:
                return Response(
                    {
                        "error": "Insufficient allowance",
                        "detail": f"You have {sender.giving_allowance} points remaining, which is less than the requested {points} points."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 3. Lock receiver row
            receiver = User.objects.select_for_update().get(id=receiver_id)

            # 4. Deduct allowance from sender (prevents negative allowance)
            sender.giving_allowance -= points
            sender.save(update_fields=['giving_allowance', 'updated_at'])

            # 5. Credit earned points to receiver
            receiver.earned_points += points
            receiver.save(update_fields=['earned_points', 'updated_at'])

            # 6. Create the Kudos record
            kudo = Kudos.objects.create(
                sender=sender,
                receiver=receiver,
                points=points,
                message=message,
                company_value=company_value
            )

            # 7. Create PointTransaction audit ledger entry
            PointTransaction.objects.create(
                sender=sender,
                receiver=receiver,
                amount=points,
                transaction_type=TransactionType.KUDO_TRANSFER,
                kudo=kudo
            )

        # Fetch with related joins for clean read response
        fresh_kudo = Kudos.objects.select_related(
            'sender',
            'receiver',
            'sender__department',
            'receiver__department'
        ).prefetch_related('reactions').get(id=kudo.id)

        response_data = {
            "message": "Kudos given successfully!",
            "kudo": KudosReadSerializer(fresh_kudo, context={'request': request}).data,
            "sender_remaining_allowance": sender.giving_allowance,
        }
        return Response(response_data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    get=extend_schema(
        tags=['Kudos'],
        summary="Retrieve Kudos detail",
        description="Retrieves specific kudos message details including sender, receiver, company value, points, and reactions.",
        responses={
            200: KudosReadSerializer,
            404: OpenApiTypes.OBJECT,
        }
    )
)
class KudosDetailAPIView(generics.RetrieveAPIView):
    """
    Retrieve single Kudos detail.
    """
    queryset = Kudos.objects.select_related(
        'sender',
        'receiver',
        'sender__department',
        'receiver__department'
    ).prefetch_related('reactions')
    serializer_class = KudosReadSerializer
    permission_classes = [AllowAny]


class KudosReactionAPIView(APIView):
    """
    Manage emoji reactions on a specific Kudo card.
    Supports POST (add reaction), DELETE (remove reaction), and GET (view summary).
    """
    permission_classes = [IsAuthenticatedOrReadOnly]

    @extend_schema(
        tags=['Reactions'],
        summary="Add an emoji reaction to a Kudo",
        description="Adds a reaction (+1, 👏, 🔥) to a specific Kudo. Enforces uniqueness so a user cannot duplicate the same emoji.",
        request=ReactionActionSerializer,
        responses={
            201: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT,
        }
    )
    def post(self, request, kudos_id):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        kudo = get_object_or_404(Kudos, id=kudos_id)
        serializer = ReactionActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reaction_type = serializer.validated_data['reaction_type']

        reaction, created = Reaction.objects.get_or_create(
            kudo=kudo,
            user=request.user,
            reaction_type=reaction_type
        )

        if not created:
            return Response(
                {
                    "error": "Duplicate reaction",
                    "detail": f"You have already reacted with {reaction_type} on this Kudo.",
                    **compute_reaction_summary(kudo, request.user)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        summary = compute_reaction_summary(kudo, request.user)
        return Response(
            {
                "message": f"Reaction {reaction_type} added successfully.",
                **summary
            },
            status=status.HTTP_201_CREATED
        )

    @extend_schema(
        tags=['Reactions'],
        summary="Remove an emoji reaction from a Kudo",
        description="Removes the user's previously submitted emoji reaction from the Kudo.",
        request=ReactionActionSerializer,
        parameters=[
            OpenApiParameter(
                name='reaction_type',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Emoji symbol to remove (+1, 👏, 🔥)'
            )
        ],
        responses={
            200: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT,
        }
    )
    def delete(self, request, kudos_id):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        kudo = get_object_or_404(Kudos, id=kudos_id)
        reaction_type = request.data.get('reaction_type') or request.query_params.get('reaction_type')

        if not reaction_type:
            return Response(
                {"detail": "The 'reaction_type' field is required in request body or query parameter."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if reaction_type not in dict(ReactionType.choices):
            return Response(
                {"detail": f"Invalid reaction type. Allowed: {list(dict(ReactionType.choices).keys())}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            reaction = Reaction.objects.get(kudo=kudo, user=request.user, reaction_type=reaction_type)
            reaction.delete()
        except Reaction.DoesNotExist:
            return Response(
                {"detail": f"You have not reacted with {reaction_type} on this Kudo."},
                status=status.HTTP_404_NOT_FOUND
            )

        summary = compute_reaction_summary(kudo, request.user)
        return Response(
            {
                "message": f"Reaction {reaction_type} removed successfully.",
                **summary
            },
            status=status.HTTP_200_OK
        )

    @extend_schema(
        tags=['Reactions'],
        summary="Get reaction summary for a Kudo",
        description="Returns reaction counts and the authenticated user's current reactions on this Kudo.",
        responses={
            200: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT,
        }
    )
    def get(self, request, kudos_id):
        kudo = get_object_or_404(Kudos, id=kudos_id)
        summary = compute_reaction_summary(kudo, request.user)
        return Response(summary, status=status.HTTP_200_OK)

import calendar
from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.db.models.functions import Coalesce
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from apps.accounts.models import User, Department
from .serializers import LeaderboardResponseSerializer, LeaderboardEntrySerializer


class LeaderboardAPIView(APIView):
    """
    Monthly Kudos Leaderboard ranking users by earned recognition points.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        tags=['Leaderboard'],
        summary="Get Monthly Kudos Leaderboard",
        description=(
            "Ranks active users based on earned Kudos points for the selected or current calendar month. "
            "Supports department filtering (Engineering, Design, Marketing, Sales). "
            "Uses efficient database-level aggregation to prevent N+1 queries."
        ),
        parameters=[
            OpenApiParameter(
                name='department',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter by department name (e.g., Engineering, Design, Marketing, Sales) or department ID'
            ),
            OpenApiParameter(
                name='month',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Month number (1-12). Defaults to current month.'
            ),
            OpenApiParameter(
                name='year',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='4-digit year (e.g., 2026). Defaults to current year.'
            ),
        ],
        responses={
            200: LeaderboardResponseSerializer,
            400: OpenApiTypes.OBJECT,
        }
    )
    def get(self, request):
        now = timezone.now()

        # Parse & Validate Year
        year_param = request.query_params.get('year')
        try:
            target_year = int(year_param) if year_param else now.year
            if target_year < 2000 or target_year > 2100:
                raise ValueError
        except ValueError:
            return Response(
                {"error": "Invalid year", "detail": "Year must be a valid 4-digit year."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parse & Validate Month
        month_param = request.query_params.get('month')
        try:
            target_month = int(month_param) if month_param else now.month
            if target_month < 1 or target_month > 12:
                raise ValueError
        except ValueError:
            return Response(
                {"error": "Invalid month", "detail": "Month must be an integer between 1 and 12."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parse & Validate Department
        dept_param = request.query_params.get('department')
        department_obj = None
        department_name_display = None

        if dept_param:
            dept_param_clean = dept_param.strip()
            # Try lookup by name or ID
            if dept_param_clean.isdigit():
                department_obj = Department.objects.filter(id=int(dept_param_clean)).first()
            else:
                department_obj = Department.objects.filter(name__iexact=dept_param_clean).first()

            if not department_obj:
                valid_depts = list(Department.objects.values_list('name', flat=True))
                return Response(
                    {
                        "error": "Invalid department",
                        "detail": f"Department '{dept_param_clean}' does not exist.",
                        "available_departments": valid_depts
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            department_name_display = department_obj.name

        # Query & Aggregation
        month_filter = Q(
            received_kudos__created_at__year=target_year,
            received_kudos__created_at__month=target_month
        )

        user_queryset = User.objects.filter(is_active=True).select_related('department')

        if department_obj:
            user_queryset = user_queryset.filter(department=department_obj)

        # Perform single aggregated SQL query with Coalesce
        ranked_users = user_queryset.annotate(
            monthly_points=Coalesce(Sum('received_kudos__points', filter=month_filter), 0),
            monthly_kudos_count=Count('received_kudos', filter=month_filter)
        ).order_by('-monthly_points', '-monthly_kudos_count', 'name')

        # Build ranked entries
        entries = []
        current_rank = 1
        for user in ranked_users:
            entries.append({
                "rank": current_rank,
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "avatar": user.avatar,
                "department": user.department,
                "monthly_points": user.monthly_points,
                "monthly_kudos_count": user.monthly_kudos_count,
            })
            current_rank += 1

        response_data = {
            "period": {
                "year": target_year,
                "month": target_month,
                "month_name": calendar.month_name[target_month],
            },
            "department": department_name_display,
            "total_participants": len(entries),
            "results": LeaderboardEntrySerializer(entries, many=True).data,
        }
        return Response(response_data, status=status.HTTP_200_OK)

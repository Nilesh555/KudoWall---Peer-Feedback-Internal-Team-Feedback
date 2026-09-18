from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from apps.accounts.models import User, Department
from .models import Kudos, CompanyValue, KudosPoint, PointTransaction
from apps.reactions.models import Reaction, ReactionType


class KudosUserSummarySerializer(serializers.ModelSerializer):
    """
    Public minimal user information for sender and receiver on Kudos cards.
    Guarantees no sensitive authentication data is ever exposed.
    """
    department_name = serializers.CharField(
        source='department.name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = User
        fields = [
            'id',
            'name',
            'email',
            'avatar',
            'department_id',
            'department_name',
        ]


class KudosCreateSerializer(serializers.Serializer):
    """
    Serializer for creating a Kudo and initiating an atomic points transfer.
    """
    receiver_id = serializers.IntegerField(
        help_text="Primary key ID of the registered peer receiving the kudo."
    )
    points = serializers.ChoiceField(
        choices=KudosPoint.choices,
        help_text="Points to transfer. Allowed values: 10, 20, 50."
    )
    message = serializers.CharField(
        min_length=5,
        max_length=1000,
        trim_whitespace=True,
        help_text="Appreciation message (5 to 1000 characters)."
    )
    company_value = serializers.ChoiceField(
        choices=CompanyValue.choices,
        help_text="Core company value: Teamwork, CustomerObsession, Innovation."
    )

    def validate_message(self, value):
        cleaned = value.strip()
        if len(cleaned) < 5:
            raise serializers.ValidationError("Message must be at least 5 non-whitespace characters.")
        return cleaned

    def validate(self, attrs):
        request = self.context.get('request')
        sender = request.user
        receiver_id = attrs.get('receiver_id')
        points = attrs.get('points')

        # 1. Receiver existence validation
        try:
            receiver = User.objects.get(id=receiver_id, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError({"receiver_id": "Receiver does not exist or is inactive."})

        # 2. Sender cannot equal receiver
        if sender.id == receiver.id:
            raise serializers.ValidationError({"receiver_id": "You cannot give Kudos to yourself."})

        # 3. Allowance balance pre-check
        if sender.giving_allowance < points:
            raise serializers.ValidationError({
                "points": f"Insufficient giving allowance. You have {sender.giving_allowance} points available, but tried to send {points}."
            })

        attrs['receiver'] = receiver
        return attrs


class KudosReadSerializer(serializers.ModelSerializer):
    """
    Feed serializer for Kudos cards including sender/receiver info,
    aggregated reaction counts, and requesting user's own reactions.
    """
    sender = KudosUserSummarySerializer(read_only=True)
    receiver = KudosUserSummarySerializer(read_only=True)
    reactions = serializers.SerializerMethodField(
        help_text="Aggregated reaction counts broken down by emoji."
    )
    user_reactions = serializers.SerializerMethodField(
        help_text="List of emoji reactions submitted by the current authenticated user on this kudo."
    )
    total_reactions = serializers.SerializerMethodField(
        help_text="Total sum of all emoji reactions on this kudo."
    )

    class Meta:
        model = Kudos
        fields = [
            'id',
            'sender',
            'receiver',
            'points',
            'message',
            'company_value',
            'reactions',
            'user_reactions',
            'total_reactions',
            'created_at',
        ]

    @extend_schema_field(serializers.DictField(child=serializers.IntegerField()))
    def get_reactions(self, obj):
        # Uses prefetched reactions in memory to prevent N+1 queries
        reactions_map = {choice[0]: 0 for choice in ReactionType.choices}
        for rx in obj.reactions.all():
            if rx.reaction_type in reactions_map:
                reactions_map[rx.reaction_type] += 1
        return reactions_map

    @extend_schema_field(serializers.ListField(child=serializers.CharField()))
    def get_user_reactions(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return []
        current_user_id = request.user.id
        return [
            rx.reaction_type for rx in obj.reactions.all()
            if rx.user_id == current_user_id
        ]

    @extend_schema_field(serializers.IntegerField())
    def get_total_reactions(self, obj):
        return len(obj.reactions.all())


class ReactionActionSerializer(serializers.Serializer):
    """
    Serializer for submitting or removing an emoji reaction on a Kudo.
    """
    reaction_type = serializers.ChoiceField(
        choices=ReactionType.choices,
        help_text="Reaction emoji. Allowed values: +1, 👏, 🔥"
    )

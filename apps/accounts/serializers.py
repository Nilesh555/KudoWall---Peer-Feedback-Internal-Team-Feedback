import uuid
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth import authenticate

from .models import Department, User


class DepartmentSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']


class DepartmentSerializer(serializers.ModelSerializer):
    user_count = serializers.IntegerField(
        source='users.count',
        read_only=True,
        help_text="Number of active users belonging to this department."
    )

    class Meta:
        model = Department
        fields = [
            'id',
            'name',
            'description',
            'user_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user_count', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    department = DepartmentSummarySerializer(read_only=True)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        write_only=True,
        required=False,
        allow_null=True
    )
    givingAllowance = serializers.IntegerField(source='giving_allowance', read_only=True)
    earnedPoints = serializers.IntegerField(source='earned_points', read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'name',
            'email',
            'avatar',
            'department',
            'department_id',
            'giving_allowance',
            'givingAllowance',
            'earned_points',
            'earnedPoints',
            'is_email_verified',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'giving_allowance',
            'givingAllowance',
            'earned_points',
            'earnedPoints',
            'is_email_verified',
            'is_active',
            'created_at',
            'updated_at',
        ]


class BadgeSerializer(serializers.Serializer):
    """
    Representation of an achievement/recognition badge.
    """
    id = serializers.CharField()
    name = serializers.CharField()
    icon = serializers.CharField()
    description = serializers.CharField()
    unlocked = serializers.BooleanField()
    count = serializers.IntegerField()


class KudoHistorySerializer(serializers.Serializer):
    """
    History card representation of a Kudos sent or received.
    """
    id = serializers.IntegerField()
    sender_id = serializers.IntegerField(source='sender.id')
    sender_name = serializers.CharField(source='sender.name')
    sender_avatar = serializers.ImageField(source='sender.avatar', read_only=True, allow_null=True)
    receiver_id = serializers.IntegerField(source='receiver.id')
    receiver_name = serializers.CharField(source='receiver.name')
    receiver_avatar = serializers.ImageField(source='receiver.avatar', read_only=True, allow_null=True)
    points = serializers.IntegerField()
    message = serializers.CharField()
    company_value = serializers.CharField()
    created_at = serializers.DateTimeField()


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Comprehensive profile serializer for the authenticated user.
    Shows user profile, allowance, earned points, badges, stats, and history.
    """
    department = DepartmentSummarySerializer(read_only=True)
    givingAllowance = serializers.IntegerField(source='giving_allowance', read_only=True)
    earnedPoints = serializers.IntegerField(source='earned_points', read_only=True)
    stats = serializers.SerializerMethodField()
    earned_badges = serializers.SerializerMethodField()
    recent_received_kudos = serializers.SerializerMethodField()
    recent_sent_kudos = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'name',
            'email',
            'avatar',
            'department',
            'giving_allowance',
            'givingAllowance',
            'earned_points',
            'earnedPoints',
            'is_email_verified',
            'stats',
            'earned_badges',
            'recent_received_kudos',
            'recent_sent_kudos',
            'created_at',
            'updated_at',
        ]

    @extend_schema_field(serializers.DictField())
    def get_stats(self, obj):
        sent_count = obj.sent_kudos.count()
        received_count = obj.received_kudos.count()
        from django.db.models import Sum
        from django.db.models.functions import Coalesce
        points_sent = obj.sent_kudos.aggregate(total=Coalesce(Sum('points'), 0))['total']

        return {
            "kudos_sent_count": sent_count,
            "kudos_received_count": received_count,
            "total_points_sent": points_sent,
            "total_points_received": obj.earned_points,
            "reactions_given_count": obj.kudo_reactions.count(),
        }

    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_earned_badges(self, obj):
        from apps.kudos.models import CompanyValue
        received = obj.received_kudos.all()
        sent_count = obj.sent_kudos.count()

        teamwork_count = sum(1 for k in received if k.company_value == CompanyValue.TEAMWORK)
        innovation_count = sum(1 for k in received if k.company_value == CompanyValue.INNOVATION)
        customer_count = sum(1 for k in received if k.company_value == CompanyValue.CUSTOMER_OBSESSION)

        return [
            {
                "id": "team-player",
                "name": "Team Player",
                "icon": "🤝",
                "description": "Recognized for exemplary teamwork and team collaboration.",
                "unlocked": teamwork_count > 0,
                "count": teamwork_count,
            },
            {
                "id": "innovation-champion",
                "name": "Innovation Champion",
                "icon": "🚀",
                "description": "Recognized for creative solutions and technical innovation.",
                "unlocked": innovation_count > 0,
                "count": innovation_count,
            },
            {
                "id": "customer-obsessed",
                "name": "Customer Obsessed",
                "icon": "🌟",
                "description": "Recognized for prioritizing users and customer delight.",
                "unlocked": customer_count > 0,
                "count": customer_count,
            },
            {
                "id": "century-club",
                "name": "Century Club",
                "icon": "💯",
                "description": "Accumulated 100 or more earned Kudos points.",
                "unlocked": obj.earned_points >= 100,
                "count": obj.earned_points,
            },
            {
                "id": "generous-giver",
                "name": "Generous Giver",
                "icon": "🎁",
                "description": "Sent 3 or more Kudos to recognize colleagues.",
                "unlocked": sent_count >= 3,
                "count": sent_count,
            },
        ]

    @extend_schema_field(KudoHistorySerializer(many=True))
    def get_recent_received_kudos(self, obj):
        recent = obj.received_kudos.select_related('sender', 'receiver').order_by('-created_at')[:10]
        return KudoHistorySerializer(recent, many=True).data

    @extend_schema_field(KudoHistorySerializer(many=True))
    def get_recent_sent_kudos(self, obj):
        recent = obj.sent_kudos.select_related('sender', 'receiver').order_by('-created_at')[:10]
        return KudoHistorySerializer(recent, many=True).data


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
        help_text="Password must be at least 8 characters."
    )
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        required=False,
        allow_null=True,
        help_text="ID of the department (e.g. Engineering, Design, Marketing, Sales)."
    )

    class Meta:
        model = User
        fields = ['name', 'email', 'password', 'department_id', 'avatar']

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return normalized

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        # Generate simulation email verification token
        verification_token = uuid.uuid4().hex
        user = User.objects.create_user(
            password=password,
            is_email_verified=False,
            email_verification_token=verification_token,
            **validated_data
        )
        return user


class EmailVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    token = serializers.CharField(max_length=128)

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        token = attrs.get('token', '').strip()
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "User with this email does not exist."})

        if user.is_email_verified:
            raise serializers.ValidationError({"detail": "Email is already verified."})

        if user.email_verification_token != token:
            raise serializers.ValidationError({"token": "Invalid or expired verification token."})

        attrs['user'] = user
        return attrs


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError("Both email and password are required.")

        user = authenticate(email=email, password=password)
        if not user:
            # Fallback check if user exists
            try:
                existing_user = User.objects.get(email__iexact=email)
                if not existing_user.check_password(password):
                    raise serializers.ValidationError("Invalid email or password.")
                user = existing_user
            except User.DoesNotExist:
                raise serializers.ValidationError("Invalid email or password.")

        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")

        attrs['user'] = user
        return attrs


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        normalized = value.strip().lower()
        if not User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("No account is registered with this email address.")
        return normalized


class ResetPasswordSerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'}
    )

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value


class TokenRefreshRequestSerializer(serializers.Serializer):
    refresh = serializers.CharField(
        required=False,
        help_text="Optional refresh token in request body. If omitted, the 'refresh_token' HTTP-only cookie will be used."
    )


class LogoutRequestSerializer(serializers.Serializer):
    refresh = serializers.CharField(
        required=False,
        help_text="Optional refresh token to blacklist. If omitted, the 'refresh_token' HTTP-only cookie will be used."
    )


from rest_framework import serializers
from apps.accounts.serializers import DepartmentSummarySerializer


class LeaderboardEntrySerializer(serializers.Serializer):
    """
    Serializer representing a ranked team member on the monthly leaderboard.
    """
    rank = serializers.IntegerField(help_text="Position on the leaderboard (1st, 2nd, etc.).")
    user_id = serializers.IntegerField(source='id', help_text="User ID.")
    name = serializers.CharField(help_text="User's full name.")
    email = serializers.EmailField(help_text="User's email.")
    avatar = serializers.ImageField(read_only=True, allow_null=True)
    department = DepartmentSummarySerializer(read_only=True)
    monthly_points = serializers.IntegerField(help_text="Total Kudos points earned during the selected month.")
    monthly_kudos_count = serializers.IntegerField(help_text="Total number of Kudos cards received this month.")


class LeaderboardResponseSerializer(serializers.Serializer):
    """
    Metadata container for the monthly leaderboard.
    """
    period = serializers.DictField(help_text="Year, month number, and month name of this leaderboard.")
    department = serializers.CharField(allow_null=True, help_text="Filter department name, or null for company-wide.")
    total_participants = serializers.IntegerField(help_text="Number of ranked participants.")
    results = LeaderboardEntrySerializer(many=True, help_text="Ranked list of users.")

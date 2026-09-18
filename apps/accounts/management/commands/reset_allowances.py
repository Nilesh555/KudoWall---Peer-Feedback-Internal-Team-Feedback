import logging
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from apps.accounts.models import User

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = (
        "Resets the monthly giving allowance of all active users to 100 points. "
        "Safe, idempotent, and executed within an atomic database transaction. "
        "Does not modify earnedPoints, Kudos history, or PointTransaction history."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--points',
            type=int,
            default=100,
            help="The giving allowance points to set (default: 100)."
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help="Simulate the allowance reset without committing changes to the database."
        )

    def handle(self, *args, **options):
        target_points = options['points']
        dry_run = options['dry_run']
        now = timezone.now()

        self.stdout.write(self.style.NOTICE(f"[{now.isoformat()}] Starting monthly giving allowance reset job..."))

        if target_points < 0:
            self.stderr.write(self.style.ERROR("Error: Points value must be greater than or equal to 0."))
            return

        with transaction.atomic():
            active_users = User.objects.filter(is_active=True)
            total_active_count = active_users.count()

            # Find users whose allowance is not already at the target value
            users_to_update = active_users.exclude(giving_allowance=target_points)
            count_to_update = users_to_update.count()

            if dry_run:
                self.stdout.write(self.style.WARNING(
                    f"[DRY-RUN] Would reset allowance to {target_points} points for {count_to_update} of {total_active_count} active users."
                ))
                return

            # Efficient bulk update in a single SQL statement
            updated_count = users_to_update.update(
                giving_allowance=target_points,
                updated_at=now
            )

        success_msg = (
            f"[{now.isoformat()}] Successfully reset giving allowance to {target_points} points for "
            f"{updated_count} users (Total active users: {total_active_count})."
        )
        logger.info(success_msg)
        self.stdout.write(self.style.SUCCESS(success_msg))

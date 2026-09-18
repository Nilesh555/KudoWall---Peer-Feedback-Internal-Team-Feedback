from django.db import models
from django.conf import settings
from django.core.validators import MinLengthValidator, MaxLengthValidator, MinValueValidator
from django.core.exceptions import ValidationError


class CompanyValue(models.TextChoices):
    TEAMWORK = 'Teamwork', 'Teamwork'
    CUSTOMER_OBSESSION = 'CustomerObsession', 'Customer Obsession'
    INNOVATION = 'Innovation', 'Innovation'


class KudosPoint(models.IntegerChoices):
    POINTS_10 = 10, '10 Points'
    POINTS_20 = 20, '20 Points'
    POINTS_50 = 50, '50 Points'


class Kudos(models.Model):
    """
    Kudos model representing peer recognition messages sent from one team member to another.
    """
    id = models.BigAutoField(primary_key=True)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_kudos',
        help_text="Authenticated user sending the recognition."
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_kudos',
        help_text="Registered peer receiving the recognition."
    )
    points = models.PositiveSmallIntegerField(
        choices=KudosPoint.choices,
        help_text="Points awarded with the kudo (10, 20, or 50)."
    )
    message = models.TextField(
        validators=[
            MinLengthValidator(5, message="Kudos message must be at least 5 characters long."),
            MaxLengthValidator(1000, message="Kudos message cannot exceed 1000 characters.")
        ],
        help_text="Appreciation message explaining what the receiver achieved."
    )
    company_value = models.CharField(
        max_length=50,
        choices=CompanyValue.choices,
        db_index=True,
        help_text="Company value / tag highlighted by this appreciation."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Timestamp when the kudo was created."
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the kudo was last modified."
    )

    class Meta:
        db_table = 'kudos'
        ordering = ['-created_at']
        verbose_name = 'Kudo'
        verbose_name_plural = 'Kudos'
        indexes = [
            models.Index(fields=['sender', 'created_at'], name='idx_kudos_sender_created'),
            models.Index(fields=['receiver', 'created_at'], name='idx_kudos_receiver_created'),
            models.Index(fields=['company_value'], name='idx_kudos_company_value'),
        ]
        constraints = [
            # Constraint 1: sender cannot equal receiver
            models.CheckConstraint(
                check=~models.Q(sender=models.F('receiver')),
                name='check_kudos_sender_not_receiver'
            ),
            # Constraint 2: points must be 10, 20, or 50
            models.CheckConstraint(
                check=models.Q(points__in=[10, 20, 50]),
                name='check_kudos_valid_points'
            ),
        ]

    def clean(self):
        super().clean()
        if self.sender_id and self.receiver_id and self.sender_id == self.receiver_id:
            raise ValidationError({'receiver': "Sender cannot send kudos to themselves."})
        if self.points not in [10, 20, 50]:
            raise ValidationError({'points': "Points must only be 10, 20, or 50."})

    def __str__(self):
        return f"Kudo #{self.id}: {self.sender.name} -> {self.receiver.name} ({self.points} pts - {self.company_value})"


class TransactionType(models.TextChoices):
    KUDO_TRANSFER = 'KUDO_TRANSFER', 'Kudos Point Transfer'
    ALLOWANCE_REPLENISHMENT = 'ALLOWANCE_REPLENISHMENT', 'Monthly Allowance Replenishment'
    ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT', 'Administrative Adjustment'


class PointTransaction(models.Model):
    """
    PointTransaction audit ledger recording all point flows between users
    or system allowance replenishments.
    """
    id = models.BigAutoField(primary_key=True)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_point_transactions',
        help_text="User whose giving allowance was debited (null for system grants)."
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_point_transactions',
        help_text="User whose points balance was credited."
    )
    amount = models.PositiveIntegerField(
        validators=[MinValueValidator(1, message="Transaction amount must be at least 1 point.")],
        help_text="Number of points transferred in this transaction."
    )
    transaction_type = models.CharField(
        max_length=40,
        choices=TransactionType.choices,
        default=TransactionType.KUDO_TRANSFER,
        db_index=True,
        help_text="Nature of the point transaction."
    )
    kudo = models.ForeignKey(
        Kudos,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='point_transactions',
        help_text="Kudo associated with this point movement, if applicable."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Timestamp when the transaction was executed."
    )

    class Meta:
        db_table = 'point_transactions'
        ordering = ['-created_at']
        verbose_name = 'Point Transaction'
        verbose_name_plural = 'Point Transactions'
        indexes = [
            models.Index(fields=['sender', 'created_at'], name='idx_tx_sender_created'),
            models.Index(fields=['receiver', 'created_at'], name='idx_tx_receiver_created'),
            models.Index(fields=['transaction_type'], name='idx_tx_type'),
        ]

    def __str__(self):
        return f"Tx #{self.id}: {self.amount} pts -> {self.receiver.name} ({self.transaction_type})"

from django.db import models
from django.conf import settings


class ReactionType(models.TextChoices):
    PLUS_ONE = '+1', '+1'
    CLAP = '👏', '👏'
    FIRE = '🔥', '🔥'


class Reaction(models.Model):
    """
    Reaction model representing emoji appreciations attached to a Kudo card.
    Prevents duplicate reactions of the same type by the same user on the same Kudo.
    """
    id = models.BigAutoField(primary_key=True)
    kudo = models.ForeignKey(
        'kudos.Kudos',
        on_delete=models.CASCADE,
        related_name='reactions',
        help_text="The Kudo card being reacted to."
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='kudo_reactions',
        help_text="The team member reacting to the Kudo."
    )
    reaction_type = models.CharField(
        max_length=10,
        choices=ReactionType.choices,
        db_index=True,
        help_text="Emoji reaction symbol (+1, 👏, 🔥)."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Timestamp when the reaction was added."
    )

    class Meta:
        db_table = 'reactions'
        ordering = ['-created_at']
        verbose_name = 'Reaction'
        verbose_name_plural = 'Reactions'
        indexes = [
            models.Index(fields=['kudo', 'reaction_type'], name='idx_reaction_kudo_type'),
            models.Index(fields=['user', 'created_at'], name='idx_reaction_user_created'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['kudo', 'user', 'reaction_type'],
                name='unique_user_kudo_reaction_type'
            )
        ]

    def __str__(self):
        return f"{self.user.name} reacted {self.reaction_type} on Kudo #{self.kudo_id}"

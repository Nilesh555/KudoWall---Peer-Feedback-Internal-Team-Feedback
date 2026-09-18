from django.contrib import admin
from .models import Reaction


@admin.register(Reaction)
class ReactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'kudo', 'user', 'reaction_type', 'created_at')
    list_filter = ('reaction_type', 'created_at')
    search_fields = ('user__name', 'user__email', 'kudo__message')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)

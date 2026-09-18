from django.contrib import admin
from .models import Kudos, PointTransaction


@admin.register(Kudos)
class KudosAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'sender',
        'receiver',
        'points',
        'company_value',
        'created_at'
    )
    list_filter = ('company_value', 'points', 'created_at')
    search_fields = (
        'sender__name',
        'sender__email',
        'receiver__name',
        'receiver__email',
        'message'
    )
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(PointTransaction)
class PointTransactionAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'sender',
        'receiver',
        'amount',
        'transaction_type',
        'kudo',
        'created_at'
    )
    list_filter = ('transaction_type', 'created_at')
    search_fields = (
        'sender__name',
        'sender__email',
        'receiver__name',
        'receiver__email'
    )
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)

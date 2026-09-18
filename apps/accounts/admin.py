from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Department, User


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'user_count', 'created_at', 'updated_at')
    search_fields = ('name', 'description')
    ordering = ('name',)

    def user_count(self, obj):
        return obj.users.count()
    user_count.short_description = 'Total Members'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        'id',
        'name',
        'email',
        'department',
        'giving_allowance',
        'earned_points',
        'is_staff',
        'is_active',
        'created_at',
    )
    list_filter = ('department', 'is_staff', 'is_active', 'created_at')
    search_fields = ('name', 'email')
    ordering = ('-created_at',)

    fieldsets = (
        ('Authentication Credentials', {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name', 'avatar', 'department')}),
        ('Gamification & Points', {'fields': ('giving_allowance', 'earned_points')}),
        ('Permissions & Roles', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Important Timestamps', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )

    readonly_fields = ('created_at', 'updated_at', 'last_login')

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password', 'department', 'giving_allowance', 'is_staff', 'is_superuser'),
        }),
    )

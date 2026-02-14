from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, Station, Division, UserAccountMeta


@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'location', 'phone', 'email', 'is_active', 'created_at')
    search_fields = ('code', 'name', 'location', 'phone', 'email')
    list_filter = ('is_active',)
    ordering = ('code',)


@admin.register(Division)
class DivisionAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'directorate', 'is_active', 'created_at')
    search_fields = ('code', 'name', 'directorate')
    list_filter = ('is_active',)
    ordering = ('code',)


class UserAccountMetaInline(admin.StackedInline):
    model = UserAccountMeta
    can_delete = False
    verbose_name_plural = 'Account Metadata'
    fk_name = 'user'
    readonly_fields = (
        'email_verified', 'email_verified_at',
        'phone_verified', 'phone_verified_at',
        'last_email_verification_sent', 'last_phone_verification_sent',
        'failed_login_attempts', 'last_failed_login',
        'account_locked_until', 'two_factor_enabled',
        'last_password_change'
    )


@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    inlines = (UserAccountMetaInline,)

    fieldsets = (
        (None, {'fields': ('staff_id', 'full_name', 'email', 'password')}),
        (_('Personal info'), {'fields': ('title', 'gender', 'date_of_birth', 'phone_number', 'marital_status', 'number_of_dependents', 'directorate', 'station', 'division', 'avatar')}),
        (_('Permissions'), {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined', 'date_registered', 'discontinued', 'discontinued_date')}),
        (_('Audit info'), {'fields': ('created_by', 'updated_by')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('staff_id', 'full_name', 'email', 'password1', 'password2', 'role', 'is_active', 'station', 'division'),
        }),
    )

    list_display = ('staff_id', 'full_name', 'email', 'role', 'is_staff', 'is_superuser', 'is_active', 'station', 'division', 'date_registered')
    search_fields = ('staff_id', 'full_name', 'email', 'station__name', 'division__name')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active', 'station', 'division')
    ordering = ('staff_id',)
    readonly_fields = ('employee_id',)
    filter_horizontal = ('groups', 'user_permissions',)


@admin.register(UserAccountMeta)
class UserAccountMetaAdmin(admin.ModelAdmin):
    list_display = (
        'user', 'is_first_login', 'email_verified', 'phone_verified', 'failed_login_attempts', 'is_account_locked'
    )
    search_fields = ('user__staff_id', 'user__full_name', 'user__email')
    list_filter = ('email_verified', 'phone_verified', 'is_first_login')
    readonly_fields = (
        'user', 'is_first_login', 'email_verified', 'email_verified_at',
        'phone_verified', 'phone_verified_at',
        'last_email_verification_sent', 'last_phone_verification_sent',
        'failed_login_attempts', 'last_failed_login',
        'account_locked_until', 'two_factor_enabled',
        'last_password_change'
    )

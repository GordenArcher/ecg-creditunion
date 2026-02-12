from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import auth, profile, admin
from .views.auth import DivisionViewSet, StationViewSet

# Routers for CRUD endpoints
router = DefaultRouter()
router.register(r"divisions", DivisionViewSet, basename="division")
router.register(r"stations", StationViewSet, basename="station")

urlpatterns = [
    path('auth/login/', auth.login_user),
    path('auth/logout/', auth.logout_user),
    path('auth/refresh/', auth.refresh_token),
    path('auth/is_authenticated/', auth.check_auth),

    path('profile/', profile.get_own_profile),
    path('profile/update/', profile.update_own_profile),
    path('profile/change-password/', profile.change_password),

    path('admin/employees/', admin.list_all_users),
    path('admin/users/create/', admin.create_staff_user),
    path('admin/users/<uuid:user_id>/update/', admin.update_staff_user),
    path('admin/users/<uuid:user_id>/update-any/', admin.update_any_user),
    path('admin/users/<uuid:user_id>/discontinue/', admin.discontinue_user),
    path('admin/users/<uuid:employee_id>/', admin.employee_detail),
    path('admin/users/<uuid:employee_id>/delete/', admin.employee_delete),
    path('admin/users/<uuid:employee_id>/toggle-discontinue/', admin.employee_toggle_discontinue),
    path('admin/users/bulk/delete/', admin.employee_bulk_delete),
    path('admin/users/bulk/toggle-discontinue/', admin.employee_bulk_toggle_discontinue),
    path('admin/users/upload/', auth.import_users_excel),

    path('stations/list/', auth.all_stations),
    path('divisions/list/', auth.all_divisions),

    path('stations/<uuid:station_id>/', auth.get_single_station),
    path('divisions/<uuid:division_id>/', auth.get_single_division),
]

urlpatterns += router.urls

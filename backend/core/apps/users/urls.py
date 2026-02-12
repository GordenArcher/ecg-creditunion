from django.urls import path
from .views import auth, profile, admin

urlpatterns = [
    # Authentication
    path('auth/login/', auth.login_user),
    path('auth/logout/', auth.logout_user),
    path('auth/refresh/', auth.refresh_token),
    path("auth/is_authenticated/", auth.check_auth),
    
    # Profile (self-management)
    path('profile/', profile.get_own_profile, name='get-profile'),
    path('profile/update/', profile.update_own_profile, name='update-profile'),
    path('profile/change-password/', profile.change_password, name='change-password'),
    
    path('admin/employees/', admin.list_all_users, name='list-users'),
    path('admin/users/create/', admin.create_staff_user, name='create-staff'),
    # path('admin/users/<uuid:user_id>/', admin.get_user_details, name='get-user'),
    path('admin/users/<uuid:user_id>/update/', admin.update_staff_user, name='update-staff'),
    path('admin/users/<uuid:user_id>/update-any/', admin.update_any_user, name='update-any-user'),
    path('admin/users/<uuid:user_id>/discontinue/', admin.discontinue_user, name='discontinue-user'),
    path('admin/users/<uuid:employee_id>/', admin.employee_detail, name='employee-detail'),
    path('admin/users/<uuid:employee_id>/delete/', admin.employee_delete),
    path('admin/users/<uuid:employee_id>/toggle-discontinue/', admin.employee_toggle_discontinue),
    path('admin/users/bulk/delete/', admin.employee_bulk_delete),
    path('admin/users/bulk/toggle-discontinue/', admin.employee_bulk_toggle_discontinue),

    path('admin/users/upload/', auth.import_users_excel),


    path('stations/', auth.all_stations),
    path('divisions/', auth.all_divisions),

]
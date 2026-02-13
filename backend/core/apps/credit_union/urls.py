
from django.urls import path
from . import views

urlpatterns = [
    path('members/upload/excel/', views.import_members_excel),
    
    # Member CRUD (add these later)
    # path('members/', views.member_list, name='member-list'),
    # path('members/<uuid:member_id>/', views.member_detail, name='member-detail'),
]
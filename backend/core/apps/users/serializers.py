from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Station, Division, User


class StationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Station
        fields = ['id', 'code', 'name', 'location', 'phone', 'email', 'is_active']


class DivisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Division
        fields = ['id', 'code', 'name', 'description', 'directorate', 'is_active']


class UserSerializer(serializers.ModelSerializer):
    station = StationSerializer(read_only=True)
    division = DivisionSerializer(read_only=True)
    station_id = serializers.PrimaryKeyRelatedField(
        queryset=Station.objects.all(),
        write_only=True,
        source='station',
        required=False
    )
    division_id = serializers.PrimaryKeyRelatedField(
        queryset=Division.objects.all(),
        write_only=True,
        source='division',
        required=False
    )
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'employee_id',
            'staff_id',
            'full_name',
            'title',
            'station',
            'station_id',
            'division',
            'division_id',
            'gender',
            'date_of_birth',
            'phone_number',
            'marital_status',
            'number_of_dependents',
            'role',
            'directorate',
            'date_registered',
            'discontinued',
            'discontinued_date',
            'avatar',
            'is_active',
            'date_joined',
            'last_login',
        ]
        read_only_fields = ['employee_id', 'date_registered', 'date_joined', 'last_login']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = [
            'email',
            'password',
            'confirm_password',
            'full_name',
            'staff_id',
            'title',
            'gender',
            'phone_number',
            'role',
            'station',
            'division',
            'date_of_birth',
            'marital_status',
            'number_of_dependents',
            'directorate',
        ]
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'full_name',
            'title',
            'gender',
            'phone_number',
            'role',
            'station',
            'division',
            'date_of_birth',
            'marital_status',
            'number_of_dependents',
            'directorate',
            'is_active',
            'discontinued',
        ]
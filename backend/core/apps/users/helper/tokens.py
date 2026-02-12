from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from rest_framework_simplejwt.settings import api_settings

def get_tokens_for_user(user):
    """
    Return refresh and access tokens for a user.
    """
    refresh = RefreshToken.for_user(user)
    return {
        'refresh_token': str(refresh),
        'access_token': str(refresh.access_token),
        'refresh_expires': (timezone.now() + api_settings.REFRESH_TOKEN_LIFETIME).isoformat(),
    }
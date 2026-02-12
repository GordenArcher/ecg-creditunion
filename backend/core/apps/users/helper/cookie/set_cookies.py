import secrets
import time

from django.conf import settings


def set_auth_cookies(response, user, tokens, request=None):

    cookie_cfg = settings.AUTH_COOKIE_SETTINGS

    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]
    refresh_exp = tokens.get(
        "refresh_token_expires_in",
        cookie_cfg["REFRESH_TOKEN_MAX_AGE"],
    )

    secure = cookie_cfg.get("SECURE", True)
    httponly = cookie_cfg.get("HTTPONLY", True)
    samesite = cookie_cfg.get("SAMESITE", "None")
    path = cookie_cfg.get("PATH", "/")
    domain = cookie_cfg.get("DOMAIN")

    response.set_cookie(
        key="tkn.sid",
        value=access_token,
        max_age=cookie_cfg["ACCESS_TOKEN_MAX_AGE"],
        secure=secure,
        httponly=httponly,
        samesite=samesite,
        path=path,
        domain=domain,
    )

    response.set_cookie(
        key="tkn.sidcc",
        value=refresh_token,
        max_age=refresh_exp,
        secure=secure,
        httponly=httponly,
        samesite=samesite,
        path=path,
        domain=domain,
    )

    response.set_cookie(
        key="isLoggedIn",
        value="true",
        max_age=refresh_exp,
        secure=secure,
        httponly=False,
        samesite=samesite,
        path=path,
        domain=domain,
    )

    return response

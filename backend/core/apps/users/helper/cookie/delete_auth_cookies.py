from django.conf import settings


def delete_auth_cookies(response):
    cookie_cfg = settings.AUTH_COOKIE_SETTINGS

    secure = cookie_cfg.get("SECURE", True)
    samesite = cookie_cfg.get("SAMESITE", "None")
    path = cookie_cfg.get("PATH", "/")
    domain = cookie_cfg.get("DOMAIN")

    keys = [
        "goria.sid",
        "goria.sidcc",
        "isLoggedIn",
        "essential",
        "isPremium",
        "theme",
        "_ga",
        "goria_analytics",
        "perf_session",
        "cookieConsent",
    ]

    for key in keys:
        response.delete_cookie(
            key=key,
            path=path,
            domain=domain,
            samesite=samesite,
        )

    return response

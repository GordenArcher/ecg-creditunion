import jwt
from datetime import datetime, timezone
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

class SilentRefreshJwtMiddleware(MiddlewareMixin):

    """ 
        - Reads access & refresh tokens from cookies. 
        - If access is expired or about to expire (< refresh_threshold seconds), tries to refresh using refresh token. 
        - If refresh succeeds: inject new access token into request.META['HTTP_AUTHORIZATION'] so DRF's authentication will run on the new token. 
        - On response, if a new access token was created, set it as an HttpOnly cookie. 
        - If SIMPLE_JWT.ROTATE_REFRESH_TOKENS is True, also rotate the refresh token and set that cookie too.

    """

    REFRESH_THRESHOLD = 60
    ACCESS_COOKIE_NAME = "tkn.sid"
    REFRESH_COOKIE_NAME = "tkn.sidcc"

    def __init__(self, get_response=None):
        super().__init__(get_response)

    def process_request(self, request):
        access_token = request.COOKIES.get(self.ACCESS_COOKIE_NAME)
        refresh_token = request.COOKIES.get(self.REFRESH_COOKIE_NAME)

        print("[Middleware] Access token:", access_token)
        print("[Middleware] Refresh token:", refresh_token)

        if not refresh_token:
            print("[Middleware] No refresh token found, cannot refresh.")
            return None

        if not access_token:
            print("[Middleware] No access token found, will try to refresh using refresh token.")
            self._try_refresh(request, refresh_token)
            return None


        try:
            decoded = jwt.decode(
                access_token,
                settings.SIMPLE_JWT.get("SIGNING_KEY", settings.SECRET_KEY),
                algorithms=[settings.SIMPLE_JWT.get("ALGORITHM", "HS256")],
                options={"verify_exp": False}
            )

            exp_ts = decoded.get("exp")
            print("[Middleware] Access token exp timestamp:", exp_ts)

            if exp_ts is None:
                print("[Middleware] No exp field in token, skipping refresh.")
                return None

            exp_dt = datetime.fromtimestamp(exp_ts, tz=timezone.utc)
            now = datetime.now(timezone.utc)
            print(f"[Middleware] Now: {now}, Exp: {exp_dt}, seconds left: {(exp_dt - now).total_seconds()}")

            if exp_dt <= now or (exp_dt - now).total_seconds() < self.REFRESH_THRESHOLD:
                print("[Middleware] Token expired or near expiry, attempting refresh...")
                self._try_refresh(request, refresh_token)
            else:
                print("[Middleware] Token is valid, no refresh needed.")

        except jwt.InvalidTokenError as e:
            print("[Middleware] Invalid access token:", e)
            return None

        return None

    def _try_refresh(self, request, refresh_token_str):
        print("[Middleware] Trying to refresh token...")
        try:
            refresh = RefreshToken(refresh_token_str)
            new_access = str(refresh.access_token)
            print("[Middleware] New access token generated:", new_access)

            request._new_access_token = new_access
            request.META["HTTP_AUTHORIZATION"] = f"Bearer {new_access}"

            if getattr(settings, "SIMPLE_JWT", {}).get("ROTATE_REFRESH_TOKENS", False):
                new_refresh = str(refresh)
                print("[Middleware] Rotated refresh token generated:", new_refresh)
                request._new_refresh_token = new_refresh

        except TokenError as e:
            print("[Middleware] Failed to refresh token:", e)
            return

    def process_response(self, request, response):
        new_access = getattr(request, "_new_access_token", None)
        new_refresh = getattr(request, "_new_refresh_token", None)

        print("[Middleware] Processing response...")
        print("[Middleware] New access token:", new_access)
        print("[Middleware] New refresh token:", new_refresh)

        cookie_cfg = getattr(settings, "AUTH_COOKIE_SETTINGS", {})
        secure = cookie_cfg.get("SECURE", True)
        httponly = cookie_cfg.get("HTTPONLY", True)
        samesite = cookie_cfg.get("SAMESITE", "None")
        path = cookie_cfg.get("PATH", "/")
        domain = cookie_cfg.get("DOMAIN")

        if new_access:
            print("[Middleware] Setting new access token cookie...")
            response.set_cookie(
                key=self.ACCESS_COOKIE_NAME,
                value=new_access,
                secure=secure,
                httponly=httponly,
                samesite=samesite,
                path=path,
                domain=domain,
                max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds())
            )

        if new_refresh:
            print("[Middleware] Setting new refresh token cookie...")
            response.set_cookie(
                key=self.REFRESH_COOKIE_NAME,
                value=new_refresh,
                secure=secure,
                httponly=httponly,
                samesite=samesite,
                path=path,
                domain=domain,
                max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds())
            )

        return response

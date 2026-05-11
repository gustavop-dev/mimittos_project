from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken


class SoftJWTAuthentication(JWTAuthentication):
    """
    Like JWTAuthentication but treats expired/invalid tokens as anonymous
    instead of raising 401. This allows AllowAny endpoints to serve public
    users even when the client sends a stale Bearer token in the header.
    Protected endpoints (IsAuthenticated) still return 403 for anonymous users.
    """

    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except InvalidToken:
            return None

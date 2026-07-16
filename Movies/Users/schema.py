"""
OpenAPI schema extensions for custom authentication classes.
"""
from drf_spectacular.extensions import OpenApiAuthenticationExtension


class CookieJWTAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = 'Users.authentication.CookieJWTAuthentication'
    name = 'cookieJWTAuth'

    def get_security_definition(self, auto_schema):
        return {
            'type': 'apiKey',
            'in': 'cookie',
            'name': 'access_token',
            'description': 'JWT access token stored in HttpOnly cookie. '
                           'The token is automatically sent with requests when credentials are included.',
        }
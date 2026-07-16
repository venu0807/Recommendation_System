import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
from django.urls import path
from Users.consumers import RecommendationConsumer

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Movies.settings')
django.setup()

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter([
            path("ws/recommendations/", RecommendationConsumer.as_asgi()),
        ])
    ),
})

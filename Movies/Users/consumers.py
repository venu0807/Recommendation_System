# Django Channels setup for real-time recommendations

# 1. Install channels
#    pip install channels

# 2. Add 'channels' to INSTALLED_APPS in settings.py
# 3. Set ASGI_APPLICATION = 'Movies.asgi.application' in settings.py
# 4. Create asgi.py in your Movies/ directory (if not present)
# 5. Add a basic consumer for recommendations

# This file: Movies/Users/consumers.py

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from asgiref.sync import sync_to_async
from urllib.parse import parse_qs

from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken


class RecommendationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Browsers cannot set Authorization headers on a WebSocket handshake,
        # so accept a JWT via ?token=... (AuthMiddlewareStack only resolves
        # session auth, which this JWT-only app does not use).
        user = self.scope.get("user")
        if not getattr(user, "is_authenticated", False):
            user = await self._user_from_query_token()

        if getattr(user, "is_authenticated", False):
            self.username = user.username
        else:
            # Accept anonymous sockets too so the client doesn't reconnect-spam;
            # they simply never receive personalized pushes.
            self.username = None
        self.group_name = f"recommend_{self.username}" if self.username else None
        if self.group_name:
            await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    @database_sync_to_async
    def _user_from_query_token(self):
        qs = parse_qs(self.scope.get("query_string", b"").decode("utf-8"))
        raw = (qs.get("token") or [None])[0]
        if not raw:
            return AnonymousUser()
        try:
            user_id = AccessToken(raw).payload.get("user_id")
            from django.contrib.auth import get_user_model

            return get_user_model().objects.get(pk=user_id)
        except (TokenError, Exception):
            return AnonymousUser()

    async def disconnect(self, close_code):
        if getattr(self, "group_name", None):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        # Optionally handle messages from client
        pass

    async def send_recommendations(self, event):
        # Send recommendations to the client
        await self.send(text_data=json.dumps(event["data"]))

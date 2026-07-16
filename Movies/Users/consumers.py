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

class RecommendationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        if user.is_authenticated:
            self.group_name = f"recommend_{user.username}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        # Optionally handle messages from client
        pass

    async def send_recommendations(self, event):
        # Send recommendations to the client
        await self.send(text_data=json.dumps(event["data"]))

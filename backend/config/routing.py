from django.urls import path

from apps.chat.consumers import VoiceAgentConsumer


websocket_urlpatterns = [
    path("ws/voice-agent/", VoiceAgentConsumer.as_asgi()),
]

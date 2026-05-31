from rest_framework import viewsets

from .models import AudioTranscription, DocumentChunk, Material
from .serializers import (
    AudioTranscriptionSerializer,
    DocumentChunkSerializer,
    MaterialSerializer,
)


class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer


class AudioTranscriptionViewSet(viewsets.ModelViewSet):
    queryset = AudioTranscription.objects.select_related("material").all()
    serializer_class = AudioTranscriptionSerializer


class DocumentChunkViewSet(viewsets.ModelViewSet):
    queryset = DocumentChunk.objects.select_related("material").all()
    serializer_class = DocumentChunkSerializer

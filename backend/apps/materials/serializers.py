from rest_framework import serializers

from .models import AudioTranscription, DocumentChunk, Material


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = "__all__"


class AudioTranscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AudioTranscription
        fields = "__all__"


class DocumentChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentChunk
        fields = "__all__"

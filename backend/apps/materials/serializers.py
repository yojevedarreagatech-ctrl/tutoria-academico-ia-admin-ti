from rest_framework import serializers

from .models import AudioTranscription, DocumentChunk, Material


class MaterialSerializer(serializers.ModelSerializer):
    chunks_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Material
        fields = [
            "id",
            "title",
            "file",
            "file_type",
            "status",
            "original_text",
            "created_at",
            "updated_at",
            "chunks_count",
        ]
        read_only_fields = [
            "file_type",
            "status",
            "original_text",
            "created_at",
            "updated_at",
            "chunks_count",
        ]


class AudioTranscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AudioTranscription
        fields = "__all__"


class DocumentChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentChunk
        fields = "__all__"

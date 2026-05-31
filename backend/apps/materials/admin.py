from django.contrib import admin

from .models import AudioTranscription, DocumentChunk, Material


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "file_type", "status", "created_at")
    list_filter = ("status", "file_type")
    search_fields = ("title", "original_text")


@admin.register(AudioTranscription)
class AudioTranscriptionAdmin(admin.ModelAdmin):
    list_display = ("id", "material", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("transcription_text",)


@admin.register(DocumentChunk)
class DocumentChunkAdmin(admin.ModelAdmin):
    list_display = ("id", "material", "chunk_index", "created_at")
    search_fields = ("content", "embedding_id")

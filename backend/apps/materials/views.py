from django.db.models import Count, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from apps.ai_core.stt import STTConfigurationError, get_stt_provider, transcribe_audio_file
from .models import AudioTranscription, DocumentChunk, Material
from .serializers import (
    AudioTranscriptionSerializer,
    DocumentChunkSerializer,
    MaterialSerializer,
)
from .services import process_material, process_text_material
from apps.ai_core.embeddings import EmbeddingConfigurationError, generate_embeddings_for_material


class MaterialViewSet(viewsets.ModelViewSet):
    serializer_class = MaterialSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Material.objects.annotate(
            chunks_count=Count("chunks", distinct=True),
            embeddings_count=Count("chunks", filter=Q(chunks__embedding__isnull=False), distinct=True),
        ).all()

    @action(detail=False, methods=["post"], url_path="upload")
    def upload(self, request):
        uploaded_file = request.FILES.get("file")
        title = (request.data.get("title") or "").strip()

        if not uploaded_file:
            return Response({"detail": "File is required."}, status=status.HTTP_400_BAD_REQUEST)

        material = Material.objects.create(
            title=title or uploaded_file.name,
            file=uploaded_file,
            file_type="unknown",
            status=Material.Status.PENDING,
        )

        try:
            process_material(material)
        except Exception as exc:
            material.refresh_from_db()
            material_with_counts = self.get_queryset().get(pk=material.pk)
            serializer = self.get_serializer(material_with_counts)
            return Response(
                {
                    "detail": str(exc),
                    "material": serializer.data,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        material_with_counts = self.get_queryset().get(pk=material.pk)
        serializer = self.get_serializer(material_with_counts)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="generate-embeddings")
    def generate_embeddings(self, request, pk=None):
        material = self.get_object()

        if material.status != Material.Status.PROCESSED:
            return Response(
                {"detail": "Embeddings can only be generated for processed materials."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            generated = generate_embeddings_for_material(material.id)
        except EmbeddingConfigurationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        material_with_counts = self.get_queryset().get(pk=material.pk)
        serializer = self.get_serializer(material_with_counts)
        return Response(
            {
                "generated_embeddings": generated,
                "material": serializer.data,
            }
        )


class AudioTranscriptionViewSet(viewsets.ModelViewSet):
    queryset = AudioTranscription.objects.select_related("material").all()
    serializer_class = AudioTranscriptionSerializer
    parser_classes = [MultiPartParser, FormParser]

    @action(detail=False, methods=["post"], url_path="upload")
    def upload(self, request):
        uploaded_file = request.FILES.get("audio_file")
        title = (request.data.get("title") or "").strip()
        manual_transcription = (request.data.get("transcription_text") or "").strip()

        if not uploaded_file:
            return Response({"detail": "audio_file is required."}, status=status.HTTP_400_BAD_REQUEST)

        material = Material.objects.create(
            title=title or uploaded_file.name,
            file=uploaded_file,
            file_type="audio",
            status=Material.Status.PENDING,
        )
        audio_transcription = AudioTranscription.objects.create(
            material=material,
            audio_file=material.file.name,
            status=AudioTranscription.Status.PENDING,
            metadata={"stt_provider": get_stt_provider()},
        )

        try:
            audio_transcription.status = AudioTranscription.Status.PROCESSING
            audio_transcription.save(update_fields=["status", "updated_at"])

            transcript_text = transcribe_audio_file(
                audio_transcription.audio_file.path,
                manual_text=manual_transcription,
            )

            audio_transcription.transcription_text = transcript_text
            audio_transcription.status = AudioTranscription.Status.PROCESSED
            audio_transcription.metadata = {
                "stt_provider": get_stt_provider(),
                "transcription_length": len(transcript_text),
            }
            audio_transcription.save(
                update_fields=["transcription_text", "status", "metadata", "updated_at"]
            )

            process_text_material(material, transcript_text, source_type="audio")
        except STTConfigurationError as exc:
            audio_transcription.status = AudioTranscription.Status.ERROR
            audio_transcription.save(update_fields=["status", "updated_at"])
            material.status = Material.Status.ERROR
            material.save(update_fields=["status", "updated_at"])
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            audio_transcription.status = AudioTranscription.Status.ERROR
            audio_transcription.save(update_fields=["status", "updated_at"])
            material.status = Material.Status.ERROR
            material.save(update_fields=["status", "updated_at"])
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        material_with_counts = Material.objects.annotate(
            chunks_count=Count("chunks", distinct=True),
            embeddings_count=Count("chunks", filter=Q(chunks__embedding__isnull=False), distinct=True),
        ).get(pk=material.pk)

        return Response(
            {
                "material": MaterialSerializer(material_with_counts).data,
                "audio_transcription": self.get_serializer(audio_transcription).data,
            },
            status=status.HTTP_201_CREATED,
        )


class DocumentChunkViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentChunkSerializer

    def get_queryset(self):
        queryset = DocumentChunk.objects.select_related("material").all()
        material_id = self.request.query_params.get("material")
        if material_id:
            queryset = queryset.filter(material_id=material_id)
        return queryset

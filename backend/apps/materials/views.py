from django.db.models import Count, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .models import AudioTranscription, DocumentChunk, Material
from .serializers import (
    AudioTranscriptionSerializer,
    DocumentChunkSerializer,
    MaterialSerializer,
)
from .services import process_material
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


class DocumentChunkViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentChunkSerializer

    def get_queryset(self):
        queryset = DocumentChunk.objects.select_related("material").all()
        material_id = self.request.query_params.get("material")
        if material_id:
            queryset = queryset.filter(material_id=material_id)
        return queryset

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .embeddings import EmbeddingConfigurationError, generate_missing_embeddings
from .retrieval import semantic_search
from .serializers import RetrievalSearchSerializer


class RetrievalSearchView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = RetrievalSearchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            results = semantic_search(
                query=serializer.validated_data["query"],
                top_k=serializer.validated_data.get("top_k", 5),
                material_id=serializer.validated_data.get("material_id"),
            )
        except EmbeddingConfigurationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "query": serializer.validated_data["query"],
                "results": results,
            }
        )


class GenerateMissingEmbeddingsView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        try:
            generated = generate_missing_embeddings()
        except EmbeddingConfigurationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"generated_embeddings": generated})

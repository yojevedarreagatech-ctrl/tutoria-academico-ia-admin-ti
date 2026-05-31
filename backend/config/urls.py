from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.chat.views import ConversationViewSet, MessageViewSet
from apps.ai_core.views import GenerateMissingEmbeddingsView, RetrievalSearchView
from apps.materials.views import (
    AudioTranscriptionViewSet,
    DocumentChunkViewSet,
    MaterialViewSet,
)
from apps.quizzes.views import QuizQuestionViewSet, QuizViewSet
from config.views import HealthCheckView


router = DefaultRouter()
router.register("materials", MaterialViewSet, basename="material")
router.register(
    "audio-transcriptions",
    AudioTranscriptionViewSet,
    basename="audio-transcription",
)
router.register("chunks", DocumentChunkViewSet, basename="document-chunk")
router.register("conversations", ConversationViewSet, basename="conversation")
router.register("messages", MessageViewSet, basename="message")
router.register("quizzes", QuizViewSet, basename="quiz")
router.register("quiz-questions", QuizQuestionViewSet, basename="quiz-question")


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", HealthCheckView.as_view(), name="health-check"),
    path("api/retrieval/search/", RetrievalSearchView.as_view(), name="retrieval-search"),
    path("api/embeddings/generate-missing/", GenerateMissingEmbeddingsView.as_view(), name="generate-missing-embeddings"),
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

from rest_framework import viewsets

from .models import Quiz, QuizQuestion
from .serializers import QuizQuestionSerializer, QuizSerializer


class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.select_related("material").all()
    serializer_class = QuizSerializer


class QuizQuestionViewSet(viewsets.ModelViewSet):
    queryset = QuizQuestion.objects.select_related("quiz").all()
    serializer_class = QuizQuestionSerializer

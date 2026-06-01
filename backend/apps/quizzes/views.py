from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.ai_core.quiz_generator import QuizGenerationError, generate_quiz_structured, get_material_for_quiz
from .models import Quiz, QuizQuestion
from .serializers import (
    QuizCheckAnswerSerializer,
    QuizGenerateSerializer,
    QuizQuestionSerializer,
    QuizSerializer,
)


class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.select_related("material").prefetch_related("questions").all()
    serializer_class = QuizSerializer

    @action(detail=False, methods=["post"], url_path="generate")
    def generate(self, request):
        serializer = QuizGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        material_id = serializer.validated_data["material_id"]
        num_questions = serializer.validated_data["num_questions"]

        try:
            material = get_material_for_quiz(material_id)
            quiz_payload = generate_quiz_structured(material_id=material_id, num_questions=num_questions)
        except QuizGenerationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            quiz = Quiz.objects.create(
                material=material,
                title=quiz_payload["title"],
                description=quiz_payload.get("description", ""),
            )
            questions = [
                QuizQuestion(
                    quiz=quiz,
                    question=question_payload["question"],
                    options=question_payload["options"],
                    correct_answer=question_payload["correct_answer"],
                    explanation=question_payload["explanation"],
                )
                for question_payload in quiz_payload["questions"]
            ]
            QuizQuestion.objects.bulk_create(questions)

        quiz.refresh_from_db()
        return Response(QuizSerializer(quiz).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="check-answer")
    def check_answer(self, request, pk=None):
        quiz = self.get_object()
        serializer = QuizCheckAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            question = quiz.questions.get(pk=serializer.validated_data["question_id"])
        except QuizQuestion.DoesNotExist:
            return Response(
                {"detail": "La pregunta indicada no pertenece a este quiz."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        selected_answer = serializer.validated_data["selected_answer"]
        return Response(
            {
                "is_correct": selected_answer == question.correct_answer,
                "correct_answer": question.correct_answer,
                "explanation": question.explanation,
            }
        )


class QuizQuestionViewSet(viewsets.ModelViewSet):
    queryset = QuizQuestion.objects.select_related("quiz").all()
    serializer_class = QuizQuestionSerializer

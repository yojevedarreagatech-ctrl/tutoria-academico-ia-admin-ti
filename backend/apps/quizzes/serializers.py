from rest_framework import serializers

from .models import Quiz, QuizQuestion


class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = [
            "id",
            "quiz",
            "question",
            "options",
            "correct_answer",
            "explanation",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class QuizSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, read_only=True)
    material_title = serializers.CharField(source="material.title", read_only=True)

    class Meta:
        model = Quiz
        fields = [
            "id",
            "material",
            "material_title",
            "title",
            "description",
            "questions",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "questions", "created_at", "updated_at", "material_title"]


class QuizGenerateSerializer(serializers.Serializer):
    material_id = serializers.IntegerField(min_value=1)
    num_questions = serializers.IntegerField(min_value=1, max_value=10, default=5)


class QuizCheckAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField(min_value=1)
    selected_answer = serializers.CharField()

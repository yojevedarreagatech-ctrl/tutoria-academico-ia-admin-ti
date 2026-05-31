from django.contrib import admin

from .models import Quiz, QuizQuestion


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "material", "created_at")
    search_fields = ("title",)


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ("id", "quiz", "created_at")
    search_fields = ("question", "correct_answer")

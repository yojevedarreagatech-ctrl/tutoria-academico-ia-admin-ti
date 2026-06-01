from django.db.models import Count
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai_core.graph import get_workflow_info, run_tutor_workflow
from .models import Conversation, Message
from .api_serializers import ChatAskSerializer
from .serializers import ConversationSerializer, MessageSerializer
from .services import build_conversation_title, has_indexed_content


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer

    def get_queryset(self):
        return Conversation.objects.annotate(messages_count=Count("messages")).all()

    @action(detail=True, methods=["get"], url_path="messages")
    def messages(self, request, pk=None):
        conversation = self.get_object()
        serializer = MessageSerializer(conversation.messages.all(), many=True)
        return Response(serializer.data)


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.select_related("conversation").all()
    serializer_class = MessageSerializer


class ChatAskView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = ChatAskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        question = serializer.validated_data["question"].strip()
        conversation_id = serializer.validated_data.get("conversation_id")
        top_k = serializer.validated_data.get("top_k", 5)
        material_id = serializer.validated_data.get("material_id")

        if not has_indexed_content(material_id=material_id):
            return Response(
                {"detail": "No hay contenido indexado con embeddings para responder."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if conversation_id:
            try:
                conversation = Conversation.objects.get(pk=conversation_id)
            except Conversation.DoesNotExist:
                return Response(
                    {"detail": "Conversation not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            conversation = Conversation.objects.create(title=build_conversation_title(question))

        Message.objects.create(
            conversation=conversation,
            role=Message.Role.USER,
            content=question,
        )

        history_qs = conversation.messages.exclude(role=Message.Role.SYSTEM).order_by("-created_at")[:6]
        history = [
            {"role": message.role, "content": message.content}
            for message in reversed(list(history_qs))
        ]

        workflow_result = run_tutor_workflow(
            {
                "question": question,
                "conversation_id": conversation.id,
                "top_k": top_k,
                "material_id": material_id,
                "conversation_history": history[:-1],
                "retrieved_chunks": [],
                "sources": [],
                "answer": None,
                "error": None,
            }
        )

        if workflow_result.get("error"):
            return Response(
                {"detail": workflow_result["error"]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        answer = workflow_result.get("answer")
        if not answer:
            return Response(
                {"detail": "No fue posible generar una respuesta del tutor."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        Message.objects.create(
            conversation=conversation,
            role=Message.Role.ASSISTANT,
            content=answer,
        )

        return Response(
            {
                "conversation_id": conversation.id,
                "answer": answer,
                "sources": workflow_result.get("sources", []),
            }
        )


class ChatWorkflowInfoView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response(get_workflow_info())

from django.db.models import Count
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai_core.graph import get_workflow_info
from .models import Conversation, Message
from .api_serializers import ChatAskSerializer
from .serializers import ConversationSerializer, MessageSerializer
from .orchestration import ChatFlowError, run_tutor_conversation_turn


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
        try:
            result = run_tutor_conversation_turn(
                question=question,
                conversation_id=conversation_id,
                top_k=top_k,
                material_id=material_id,
                mode="text",
            )
        except ChatFlowError as exc:
            message = str(exc)
            status_code = status.HTTP_404_NOT_FOUND if message == "Conversation not found." else status.HTTP_400_BAD_REQUEST
            return Response({"detail": message}, status=status_code)

        return Response(
            {
                "conversation_id": result["conversation_id"],
                "answer": result["answer"],
                "sources": result["sources"],
            }
        )


class ChatWorkflowInfoView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response(get_workflow_info())

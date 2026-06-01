from rest_framework import serializers


class ChatAskSerializer(serializers.Serializer):
    question = serializers.CharField()
    conversation_id = serializers.IntegerField(required=False, allow_null=True)
    top_k = serializers.IntegerField(required=False, default=5, min_value=1, max_value=10)
    material_id = serializers.IntegerField(required=False, allow_null=True)

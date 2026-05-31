from rest_framework import serializers


class RetrievalSearchSerializer(serializers.Serializer):
    query = serializers.CharField()
    top_k = serializers.IntegerField(required=False, default=5, min_value=1, max_value=20)
    material_id = serializers.IntegerField(required=False, allow_null=True)

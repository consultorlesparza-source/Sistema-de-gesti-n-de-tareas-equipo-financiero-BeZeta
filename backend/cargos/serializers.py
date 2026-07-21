from rest_framework import serializers

from .models import Cargo


class CargoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cargo
        fields = ["id", "codigo", "nombre", "area", "objetivo", "reemplazado_por", "activo"]

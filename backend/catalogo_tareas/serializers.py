from rest_framework import serializers

from .models import CatalogoTarea


class CatalogoTareaSerializer(serializers.ModelSerializer):
    cargo_codigo = serializers.CharField(source="cargo.codigo", read_only=True)

    class Meta:
        model = CatalogoTarea
        fields = [
            "id", "cargo", "cargo_codigo", "nombre", "descripcion",
            "periodicidad", "peso_kpi", "activo",
        ]

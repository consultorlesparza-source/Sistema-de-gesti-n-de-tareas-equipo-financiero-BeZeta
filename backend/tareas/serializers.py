from rest_framework import serializers

from .models import HistorialEstado, Tarea


class HistorialEstadoSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source="usuario.get_full_name", read_only=True)

    class Meta:
        model = HistorialEstado
        fields = ["id", "estado_anterior", "estado_nuevo", "usuario", "usuario_nombre", "comentario", "fecha"]
        read_only_fields = fields


class TareaSerializer(serializers.ModelSerializer):
    catalogo_nombre = serializers.CharField(source="catalogo.nombre", read_only=True)
    cargo_codigo = serializers.CharField(source="catalogo.cargo.codigo", read_only=True)
    usuario_nombre = serializers.CharField(source="usuario.get_full_name", read_only=True)
    historial = HistorialEstadoSerializer(many=True, read_only=True)

    class Meta:
        model = Tarea
        fields = [
            "id", "catalogo", "catalogo_nombre", "cargo_codigo", "usuario", "usuario_nombre",
            "periodo", "fecha_vencimiento", "estado", "vencida", "creada_por",
            "comentario_gerente", "creada_en", "actualizada_en", "historial",
        ]
        read_only_fields = ["id", "estado", "vencida", "creada_por", "creada_en", "actualizada_en", "historial"]


class TareaCreateSerializer(serializers.ModelSerializer):
    """Usado por el Gerente para generar/asignar tareas manualmente (Fase 1)."""

    class Meta:
        model = Tarea
        fields = ["id", "catalogo", "usuario", "periodo", "fecha_vencimiento", "comentario_gerente"]

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["creada_por"] = request.user
        tarea = super().create(validated_data)
        HistorialEstado.objects.create(
            tarea=tarea,
            estado_anterior="",
            estado_nuevo=Tarea.Estado.PENDIENTE,
            usuario=request.user,
            comentario="Tarea creada.",
        )
        return tarea


class ValidarTareaSerializer(serializers.Serializer):
    """Body para que el Gerente confirme el estado final de una tarea en revisión."""

    estado = serializers.ChoiceField(choices=sorted(Tarea.ESTADOS_FINALES))
    comentario = serializers.CharField(required=False, allow_blank=True)

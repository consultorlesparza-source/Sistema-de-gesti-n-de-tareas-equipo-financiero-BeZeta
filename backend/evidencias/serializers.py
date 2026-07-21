from rest_framework import serializers

from .models import Evidencia

EXTENSIONES_PERMITIDAS = {".pdf", ".jpg", ".jpeg", ".png", ".xlsx", ".xls", ".docx", ".doc"}
TAMANO_MAXIMO_MB = 15


class EvidenciaSerializer(serializers.ModelSerializer):
    subido_por_nombre = serializers.CharField(source="subido_por.get_full_name", read_only=True)

    class Meta:
        model = Evidencia
        fields = [
            "id", "tarea", "archivo", "nombre_archivo", "comentario",
            "subido_por", "subido_por_nombre", "fecha_subida", "anulada",
        ]
        read_only_fields = ["id", "nombre_archivo", "subido_por", "fecha_subida", "anulada"]

    def validate_archivo(self, archivo):
        extension = "." + archivo.name.rsplit(".", 1)[-1].lower() if "." in archivo.name else ""
        if extension not in EXTENSIONES_PERMITIDAS:
            raise serializers.ValidationError(
                f"Tipo de archivo no permitido ({extension}). Permitidos: {', '.join(sorted(EXTENSIONES_PERMITIDAS))}."
            )
        if archivo.size > TAMANO_MAXIMO_MB * 1024 * 1024:
            raise serializers.ValidationError(f"El archivo supera el tamaño máximo de {TAMANO_MAXIMO_MB} MB.")
        return archivo

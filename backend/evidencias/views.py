from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated

from tareas.models import Tarea
from usuarios.models import Usuario

from .models import Evidencia
from .serializers import EvidenciaSerializer


class EvidenciaViewSet(viewsets.ModelViewSet):
    """Evidencia de respaldo de cada tarea. No se permite borrar; solo anular (soft delete)."""

    serializer_class = EvidenciaSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "head", "options"]  # sin "delete"
    filterset_fields = ["tarea", "anulada"]

    def get_queryset(self):
        user = self.request.user
        qs = Evidencia.objects.select_related("tarea", "subido_por")
        if user.rol in (Usuario.Rol.GERENTE, Usuario.Rol.DIRECCION):
            return qs
        return qs.filter(tarea__usuario=user)

    def perform_create(self, serializer):
        user = self.request.user
        tarea = serializer.validated_data["tarea"]
        if user.rol == Usuario.Rol.GERENTE:
            pass
        elif tarea.usuario_id != user.id:
            raise PermissionDenied("Solo puedes subir evidencia a tus propias tareas.")
        elif tarea.estado != Tarea.Estado.PENDIENTE:
            raise ValidationError("Solo puedes subir evidencia mientras la tarea está en estado 'Pendiente'.")
        serializer.save(subido_por=user)

    def perform_update(self, serializer):
        # El único cambio permitido vía update es marcar "anulada" (solo el Gerente).
        if self.request.user.rol != Usuario.Rol.GERENTE:
            raise PermissionDenied("Solo el Gerente puede modificar una evidencia existente.")
        serializer.save()

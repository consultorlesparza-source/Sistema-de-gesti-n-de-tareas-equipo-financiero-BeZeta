from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from usuarios.models import Usuario

from .models import HistorialEstado, Tarea
from .serializers import TareaCreateSerializer, TareaSerializer, ValidarTareaSerializer


class TareaViewSet(viewsets.ModelViewSet):
    """Tareas del periodo. Cada colaborador ve/gestiona solo las suyas; el Gerente ve todas."""

    permission_classes = [IsAuthenticated]
    filterset_fields = ["estado", "vencida", "periodo", "usuario", "catalogo__cargo"]

    def get_queryset(self):
        user = self.request.user
        qs = Tarea.objects.select_related("catalogo", "catalogo__cargo", "usuario").prefetch_related("historial")
        if user.rol in (Usuario.Rol.GERENTE, Usuario.Rol.DIRECCION):
            return qs
        return qs.filter(usuario=user)

    def get_serializer_class(self):
        if self.action == "create":
            return TareaCreateSerializer
        return TareaSerializer

    def check_es_gerente(self):
        if self.request.user.rol != Usuario.Rol.GERENTE:
            raise PermissionDenied("Solo el Gerente de Finanzas puede realizar esta acción.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        # Se responde con la representación completa (incluye estado e historial),
        # no con el serializer de entrada usado para crear.
        output = TareaSerializer(serializer.instance)
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        self.check_es_gerente()
        serializer.save()

    def perform_update(self, serializer):
        # Solo el Gerente puede reprogramar fecha de vencimiento / editar la tarea directamente.
        self.check_es_gerente()
        serializer.save()

    def perform_destroy(self, instance):
        self.check_es_gerente()
        instance.delete()

    @action(detail=True, methods=["post"], url_path="enviar-a-revision")
    def enviar_a_revision(self, request, pk=None):
        """El colaborador propietario marca la tarea como 'En revisión' (debe haber subido evidencia)."""
        tarea = self.get_object()
        if tarea.usuario_id != request.user.id:
            raise PermissionDenied("Solo el colaborador asignado puede enviar la tarea a revisión.")
        if tarea.estado != Tarea.Estado.PENDIENTE:
            return Response(
                {"detail": "Solo se puede enviar a revisión una tarea en estado 'Pendiente'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not tarea.evidencias.filter(anulada=False).exists():
            return Response(
                {"detail": "Debes subir al menos una evidencia antes de enviar a revisión."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        estado_anterior = tarea.estado
        tarea.estado = Tarea.Estado.EN_REVISION
        tarea.save(update_fields=["estado", "actualizada_en"])
        HistorialEstado.objects.create(
            tarea=tarea, estado_anterior=estado_anterior, estado_nuevo=tarea.estado,
            usuario=request.user, comentario="Colaborador envió la tarea a revisión.",
        )
        tarea.refresh_from_db()  # limpia la caché de prefetch_related("historial")
        return Response(TareaSerializer(tarea).data)

    @action(detail=True, methods=["post"])
    def validar(self, request, pk=None):
        """El Gerente confirma el estado final: Entregado, Parcialmente entregado o No logrado."""
        self.check_es_gerente()
        tarea = self.get_object()
        serializer = ValidarTareaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        estado_anterior = tarea.estado
        tarea.estado = serializer.validated_data["estado"]
        comentario = serializer.validated_data.get("comentario", "")
        if comentario:
            tarea.comentario_gerente = comentario
        tarea.save(update_fields=["estado", "comentario_gerente", "actualizada_en"])
        HistorialEstado.objects.create(
            tarea=tarea, estado_anterior=estado_anterior, estado_nuevo=tarea.estado,
            usuario=request.user, comentario=comentario,
        )
        tarea.refresh_from_db()  # limpia la caché de prefetch_related("historial")
        return Response(TareaSerializer(tarea).data)

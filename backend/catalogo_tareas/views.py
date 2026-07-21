from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from usuarios.permissions import EsGerenteOSoloLecturaDireccion

from .models import CatalogoTarea
from .serializers import CatalogoTareaSerializer


class CatalogoTareaViewSet(viewsets.ModelViewSet):
    """Plantillas de tareas por cargo. Gerente gestiona; el resto solo consulta."""

    queryset = CatalogoTarea.objects.select_related("cargo").all()
    serializer_class = CatalogoTareaSerializer
    filterset_fields = ["cargo", "periodicidad", "activo"]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [EsGerenteOSoloLecturaDireccion()]

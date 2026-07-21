from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from usuarios.permissions import EsGerenteOSoloLecturaDireccion

from .models import Cargo
from .serializers import CargoSerializer


class CargoViewSet(viewsets.ModelViewSet):
    """Catálogo de cargos. Gerente gestiona; Dirección y colaboradores solo consultan."""

    queryset = Cargo.objects.all()
    serializer_class = CargoSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [EsGerenteOSoloLecturaDireccion()]

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Usuario
from .permissions import EsGerente
from .serializers import UsuarioCreateSerializer, UsuarioSerializer


class UsuarioViewSet(viewsets.ModelViewSet):
    """CRUD de usuarios. Solo el Gerente administra usuarios."""

    queryset = Usuario.objects.select_related("cargo").all()
    permission_classes = [EsGerente]

    def get_serializer_class(self):
        if self.action == "create":
            return UsuarioCreateSerializer
        return UsuarioSerializer

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Devuelve el usuario autenticado (cualquier rol)."""
        serializer = UsuarioSerializer(request.user)
        return Response(serializer.data)

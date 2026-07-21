from rest_framework.permissions import SAFE_METHODS, BasePermission

from .models import Usuario


class EsGerente(BasePermission):
    """Solo el Gerente de Finanzas (rol=gerente) puede acceder."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.rol == Usuario.Rol.GERENTE)


class EsGerenteOSoloLecturaDireccion(BasePermission):
    """El Gerente tiene acceso completo; Dirección General solo lectura; colaborador sin acceso."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.rol == Usuario.Rol.GERENTE:
            return True
        if request.user.rol == Usuario.Rol.DIRECCION:
            return request.method in SAFE_METHODS
        return False


class EsGerenteOColaboradorPropietario(BasePermission):
    """El Gerente ve/gestiona todo; el colaborador solo sus propios objetos (tareas/evidencias)."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.rol in (Usuario.Rol.GERENTE, Usuario.Rol.DIRECCION):
            return request.method in SAFE_METHODS or user.rol == Usuario.Rol.GERENTE
        propietario_id = getattr(obj, "usuario_id", None)
        if propietario_id is None:
            propietario_id = getattr(obj.tarea, "usuario_id", None)
        return propietario_id == user.id

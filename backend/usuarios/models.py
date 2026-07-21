from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    """Usuario del sistema. Extiende el modelo de auth de Django con rol y cargo."""

    class Rol(models.TextChoices):
        GERENTE = "gerente", "Administrador / Gerente de Finanzas"
        COLABORADOR = "colaborador", "Colaborador"
        DIRECCION = "direccion", "Dirección General (solo lectura)"

    email = models.EmailField(unique=True)
    rol = models.CharField(max_length=20, choices=Rol.choices, default=Rol.COLABORADOR)
    cargo = models.ForeignKey(
        "cargos.Cargo", null=True, blank=True, on_delete=models.SET_NULL, related_name="usuarios"
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_rol_display()})"

    @property
    def es_gerente(self):
        return self.rol == self.Rol.GERENTE

    @property
    def es_direccion(self):
        return self.rol == self.Rol.DIRECCION

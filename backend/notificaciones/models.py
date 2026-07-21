from django.conf import settings
from django.db import models


class Notificacion(models.Model):
    """Registro de correos enviados, para evitar duplicados (motor de notificaciones, Fase 2)."""

    class Tipo(models.TextChoices):
        CREACION = "creacion", "Tarea creada"
        AVISO_VENCIMIENTO = "aviso_vencimiento", "Aviso de vencimiento (3 días)"
        VENCIMIENTO_CUMPLIDO = "vencimiento_cumplido", "Vencimiento cumplido"

    tarea = models.ForeignKey(
        "tareas.Tarea", on_delete=models.CASCADE, null=True, blank=True, related_name="notificaciones"
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notificaciones"
    )
    tipo = models.CharField(max_length=30, choices=Tipo.choices)
    enviado_en = models.DateTimeField(auto_now_add=True)
    exitoso = models.BooleanField(default=True)
    detalle = models.TextField(blank=True)

    class Meta:
        ordering = ["-enviado_en"]
        verbose_name = "Notificación"
        verbose_name_plural = "Notificaciones"
        constraints = [
            models.UniqueConstraint(
                fields=["tarea", "usuario", "tipo"], name="unica_notificacion_por_tarea_y_tipo"
            )
        ]

    def __str__(self):
        return f"{self.get_tipo_display()} → {self.usuario} ({self.tarea})"

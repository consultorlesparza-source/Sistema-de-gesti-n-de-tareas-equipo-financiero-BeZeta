from django.conf import settings
from django.db import models
from django.utils import timezone


class Tarea(models.Model):
    """Instancia real de una tarea del catálogo, asignada a un usuario en un periodo."""

    class Estado(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        EN_REVISION = "en_revision", "En revisión"
        PARCIAL = "parcial", "Parcialmente entregado"
        ENTREGADO = "entregado", "Entregado"
        NO_LOGRADO = "no_logrado", "No logrado"

    # Estados finales que el Gerente puede confirmar desde "En revisión".
    ESTADOS_FINALES = {Estado.PARCIAL, Estado.ENTREGADO, Estado.NO_LOGRADO}

    catalogo = models.ForeignKey(
        "catalogo_tareas.CatalogoTarea", on_delete=models.PROTECT, related_name="tareas"
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tareas_asignadas"
    )
    periodo = models.CharField(max_length=7, help_text="Formato AAAA-MM")
    fecha_vencimiento = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.PENDIENTE)
    vencida = models.BooleanField(default=False)
    creada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="tareas_creadas"
    )
    comentario_gerente = models.TextField(blank=True)
    creada_en = models.DateTimeField(auto_now_add=True)
    actualizada_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-periodo", "fecha_vencimiento"]
        verbose_name = "Tarea"
        verbose_name_plural = "Tareas"
        constraints = [
            models.UniqueConstraint(
                fields=["catalogo", "usuario", "periodo"], name="unica_tarea_por_periodo"
            )
        ]

    def __str__(self):
        return f"{self.catalogo.nombre} — {self.usuario} ({self.periodo})"

    def marcar_vencida(self):
        """Marca la tarea como vencida si corresponde (usado por el job diario)."""
        if (
            not self.vencida
            and self.fecha_vencimiento
            and self.fecha_vencimiento < timezone.localdate()
            and self.estado not in (self.Estado.ENTREGADO, self.Estado.PARCIAL)
        ):
            self.vencida = True
            if self.estado in (self.Estado.PENDIENTE, self.Estado.EN_REVISION):
                self.estado = self.Estado.NO_LOGRADO
            self.save(update_fields=["vencida", "estado", "actualizada_en"])
            return True
        return False


class HistorialEstado(models.Model):
    """Bitácora de cada cambio de estado de una tarea (auditoría y trazabilidad)."""

    tarea = models.ForeignKey(Tarea, on_delete=models.CASCADE, related_name="historial")
    estado_anterior = models.CharField(max_length=20, choices=Tarea.Estado.choices, blank=True)
    estado_nuevo = models.CharField(max_length=20, choices=Tarea.Estado.choices)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="cambios_estado"
    )
    comentario = models.TextField(blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha"]
        verbose_name = "Historial de estado"
        verbose_name_plural = "Historial de estados"

    def __str__(self):
        return f"{self.tarea} : {self.estado_anterior} → {self.estado_nuevo}"

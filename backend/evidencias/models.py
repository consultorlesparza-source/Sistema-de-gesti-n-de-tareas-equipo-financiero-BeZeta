from django.conf import settings
from django.db import models


def ruta_evidencia(instance, filename):
    return f"evidencias/tarea_{instance.tarea_id}/{filename}"


class Evidencia(models.Model):
    """Archivo o comentario subido como respaldo de una tarea.

    En desarrollo se guarda en el almacenamiento local (MEDIA_ROOT); en producción
    se recomienda un backend de storage de objetos (S3 / GCS) vía django-storages,
    guardando en BD solo la referencia (ver sección 7 del documento de diseño).
    """

    tarea = models.ForeignKey(
        "tareas.Tarea", on_delete=models.CASCADE, related_name="evidencias"
    )
    archivo = models.FileField(upload_to=ruta_evidencia)
    nombre_archivo = models.CharField(max_length=255, blank=True)
    comentario = models.TextField(blank=True)
    subido_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="evidencias_subidas"
    )
    fecha_subida = models.DateTimeField(auto_now_add=True)
    anulada = models.BooleanField(
        default=False, help_text="No se borra evidencia; se marca como anulada para conservar trazabilidad."
    )

    class Meta:
        ordering = ["-fecha_subida"]
        verbose_name = "Evidencia"
        verbose_name_plural = "Evidencias"

    def __str__(self):
        return f"{self.nombre_archivo or self.archivo.name} — {self.tarea}"

    def save(self, *args, **kwargs):
        if not self.nombre_archivo and self.archivo:
            self.nombre_archivo = self.archivo.name
        super().save(*args, **kwargs)

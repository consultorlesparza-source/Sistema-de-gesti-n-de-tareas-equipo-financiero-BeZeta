from django.db import models


class Cargo(models.Model):
    """Descriptor de cargo (RGI-BZ-068 a 070)."""

    codigo = models.CharField(max_length=20, unique=True, help_text="Ej: RGI-BZ-068")
    nombre = models.CharField(max_length=150)
    area = models.CharField(max_length=150, blank=True)
    objetivo = models.TextField(blank=True)
    reemplazado_por = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="reemplaza_a"
    )
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["codigo"]
        verbose_name = "Cargo"
        verbose_name_plural = "Cargos"

    def __str__(self):
        return f"{self.codigo} — {self.nombre}"

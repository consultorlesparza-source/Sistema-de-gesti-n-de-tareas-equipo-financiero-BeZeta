from django.db import models


class CatalogoTarea(models.Model):
    """Plantilla de tarea/responsabilidad por cargo, usada para generar tareas del periodo."""

    class Periodicidad(models.TextChoices):
        DIARIA = "diaria", "Diaria"
        SEMANAL = "semanal", "Semanal"
        MENSUAL = "mensual", "Mensual"
        TRIMESTRAL = "trimestral", "Trimestral"
        ANUAL = "anual", "Anual"

    cargo = models.ForeignKey(
        "cargos.Cargo", on_delete=models.CASCADE, related_name="catalogo_tareas"
    )
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    periodicidad = models.CharField(max_length=20, choices=Periodicidad.choices)
    peso_kpi = models.DecimalField(max_digits=5, decimal_places=2, default=1)
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["cargo", "nombre"]
        verbose_name = "Tarea de catálogo"
        verbose_name_plural = "Catálogo de tareas"

    def __str__(self):
        return f"{self.nombre} ({self.get_periodicidad_display()}) — {self.cargo.codigo}"

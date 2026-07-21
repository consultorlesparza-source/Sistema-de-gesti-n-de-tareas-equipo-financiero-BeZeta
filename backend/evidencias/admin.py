from django.contrib import admin

from .models import Evidencia


@admin.register(Evidencia)
class EvidenciaAdmin(admin.ModelAdmin):
    list_display = ("nombre_archivo", "tarea", "subido_por", "fecha_subida", "anulada")
    list_filter = ("anulada", "fecha_subida")
    search_fields = ("nombre_archivo", "tarea__catalogo__nombre")
    readonly_fields = ("fecha_subida",)

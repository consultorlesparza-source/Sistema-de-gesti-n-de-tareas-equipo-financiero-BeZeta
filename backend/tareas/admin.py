from django.contrib import admin

from .models import HistorialEstado, Tarea


class HistorialEstadoInline(admin.TabularInline):
    model = HistorialEstado
    extra = 0
    readonly_fields = ("estado_anterior", "estado_nuevo", "usuario", "comentario", "fecha")
    can_delete = False


@admin.register(Tarea)
class TareaAdmin(admin.ModelAdmin):
    list_display = (
        "catalogo", "usuario", "periodo", "fecha_vencimiento", "estado", "vencida",
    )
    list_filter = ("estado", "vencida", "periodo", "catalogo__cargo")
    search_fields = ("catalogo__nombre", "usuario__email", "usuario__first_name", "usuario__last_name")
    inlines = [HistorialEstadoInline]
    autocomplete_fields = ["catalogo", "usuario", "creada_por"]


@admin.register(HistorialEstado)
class HistorialEstadoAdmin(admin.ModelAdmin):
    list_display = ("tarea", "estado_anterior", "estado_nuevo", "usuario", "fecha")
    list_filter = ("estado_nuevo",)
    readonly_fields = ("fecha",)

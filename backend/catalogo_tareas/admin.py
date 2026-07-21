from django.contrib import admin

from .models import CatalogoTarea


@admin.register(CatalogoTarea)
class CatalogoTareaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "cargo", "periodicidad", "peso_kpi", "activo")
    list_filter = ("periodicidad", "activo", "cargo")
    search_fields = ("nombre", "cargo__codigo", "cargo__nombre")

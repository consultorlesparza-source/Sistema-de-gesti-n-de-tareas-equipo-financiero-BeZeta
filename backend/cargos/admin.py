from django.contrib import admin

from .models import Cargo


@admin.register(Cargo)
class CargoAdmin(admin.ModelAdmin):
    list_display = ("codigo", "nombre", "area", "activo")
    list_filter = ("activo", "area")
    search_fields = ("codigo", "nombre", "area")

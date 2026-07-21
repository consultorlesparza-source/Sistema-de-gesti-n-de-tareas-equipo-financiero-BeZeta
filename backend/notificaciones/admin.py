from django.contrib import admin

from .models import Notificacion


@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ("tipo", "usuario", "tarea", "enviado_en", "exitoso")
    list_filter = ("tipo", "exitoso")
    search_fields = ("usuario__email", "tarea__catalogo__nombre")
    readonly_fields = ("enviado_en",)

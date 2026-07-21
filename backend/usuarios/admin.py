from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    model = Usuario
    list_display = ("email", "username", "first_name", "last_name", "rol", "cargo", "is_active")
    list_filter = ("rol", "cargo", "is_active")
    search_fields = ("email", "username", "first_name", "last_name")
    ordering = ("email",)
    fieldsets = UserAdmin.fieldsets + (
        ("Datos BeZeta", {"fields": ("rol", "cargo")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Datos BeZeta", {"fields": ("email", "rol", "cargo")}),
    )

from rest_framework.routers import DefaultRouter

from .views import CatalogoTareaViewSet

router = DefaultRouter()
router.register("catalogo-tareas", CatalogoTareaViewSet, basename="catalogo-tarea")

urlpatterns = router.urls

from rest_framework.routers import DefaultRouter

from .views import TareaViewSet

router = DefaultRouter()
router.register("tareas", TareaViewSet, basename="tarea")

urlpatterns = router.urls

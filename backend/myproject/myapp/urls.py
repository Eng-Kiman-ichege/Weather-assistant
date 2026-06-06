from django.urls import path
from . import views

urlpatterns = [
    path('weather/', views.weather_view, name='weather'),
    path('ai-suggestion/', views.ai_suggestion_view, name='ai_suggestion'),
]

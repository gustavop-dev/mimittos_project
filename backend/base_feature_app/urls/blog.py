from django.urls import path

from base_feature_app.views import blog_crud

urlpatterns = [
    path('blogs/', blog_crud.blogs, name='blogs'),
    path('blogs/<int:blog_id>/', blog_crud.blog_detail, name='blog-detail'),
]

from django.urls import path
from base_feature_app.views import catalog

urlpatterns = [
    path('sizes/', catalog.sizes_list, name='sizes-list'),
    path('colors/', catalog.colors_list, name='colors-list'),
    path('categories/', catalog.categories, name='categories'),
    path('categories/<int:category_id>/', catalog.category_detail, name='category-detail'),
    path('peluches/', catalog.peluches, name='peluches'),
    path('peluches/featured/', catalog.peluches_featured, name='peluches-featured'),
    path('peluches/<slug:slug>/', catalog.peluch_detail, name='peluch-detail'),
]

from django.urls import path
from base_feature_app.views import catalog

urlpatterns = [
    path('sizes/', catalog.sizes_list, name='sizes-list'),
    path('sizes/<int:size_id>/', catalog.size_detail, name='size-detail'),
    path('colors/', catalog.colors_list, name='colors-list'),
    path('colors/<int:color_id>/', catalog.color_detail, name='color-detail'),
    path('categories/', catalog.categories, name='categories'),
    path('categories/<int:category_id>/', catalog.category_detail, name='category-detail'),
    path('peluches/', catalog.peluches, name='peluches'),
    path('peluches/featured/', catalog.peluches_featured, name='peluches-featured'),
    path('peluches/bulk-category/', catalog.peluch_bulk_category, name='peluch-bulk-category'),
    path('peluches/<slug:slug>/', catalog.peluch_detail, name='peluch-detail'),
    path('peluches/<slug:slug>/gallery/', catalog.peluch_gallery_upload, name='peluch-gallery-upload'),
    path('peluches/<slug:slug>/gallery/<int:attachment_id>/', catalog.peluch_gallery_delete, name='peluch-gallery-delete'),
    path('peluches/<slug:slug>/color-image/<slug:color_slug>/', catalog.peluch_color_image_list_upload, name='peluch-color-image'),
    path('peluches/<slug:slug>/color-image/<slug:color_slug>/<int:pci_id>/', catalog.peluch_color_image_delete, name='peluch-color-image-delete'),
]

from django.urls import path
from base_feature_app.views import review_views

urlpatterns = [
    path('peluches/<slug:slug>/reviews/', review_views.peluch_reviews, name='peluch-reviews'),
    path('reviews/home/', review_views.home_reviews, name='reviews-home'),
    path('reviews/<int:review_id>/approve/', review_views.approve_review, name='review-approve'),
]

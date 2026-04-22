from django.db.models import Avg
from django.core.exceptions import ValidationError

from base_feature_app.models import Review, Peluch, Order


class ReviewService:

    @staticmethod
    def create_review(peluch: Peluch, user, order, rating: int, comment: str) -> Review:
        has_purchased = Order.objects.filter(
            customer=user,
            status=Order.Status.DELIVERED,
            items__peluch=peluch,
        ).exists()
        if not has_purchased:
            raise ValidationError('Solo puedes reseñar peluches que hayas comprado y recibido.')

        if Review.objects.filter(peluch=peluch, user=user).exists():
            raise ValidationError('Ya tienes una reseña para este peluche.')

        review = Review.objects.create(
            peluch=peluch,
            user=user,
            order=order,
            rating=rating,
            comment=comment,
        )
        ReviewService.update_peluch_rating(peluch)
        return review

    @staticmethod
    def update_peluch_rating(peluch: Peluch) -> None:
        approved_reviews = Review.objects.filter(peluch=peluch, is_approved=True)
        agg = approved_reviews.aggregate(avg=Avg('rating'))
        avg_rating = agg['avg'] or 0.00
        count = approved_reviews.count()

        Peluch.objects.filter(pk=peluch.pk).update(
            average_rating=round(avg_rating, 2),
            review_count=count,
        )

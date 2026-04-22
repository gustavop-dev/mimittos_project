from django.core.management.base import BaseCommand, CommandError

from base_feature_app.models import (
    Blog,
    Category,
    GlobalColor,
    GlobalSize,
    Order,
    Peluch,
    User,
)

from ._fake_data import FAKE_EMAIL_DOMAIN, FAKE_SLUG_PREFIX, is_fake_blog_title


class Command(BaseCommand):
    help = 'Delete fake records created by create_fake_data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion of fake data.',
        )

    def handle(self, *args, **options):
        if not options.get('confirm'):
            raise CommandError('Deletion not confirmed. Re-run with --confirm.')

        self.stdout.write(self.style.SUCCESS('==== Deleting Fake Data ===='))

        fake_orders = Order.objects.filter(customer_email__iendswith=f'@{FAKE_EMAIL_DOMAIN}')
        order_count = fake_orders.count()
        self.stdout.write(self.style.SUCCESS('\n--- Deleting Orders ---'))
        fake_orders.delete()
        self.stdout.write(self.style.SUCCESS(f'{order_count} Orders deleted'))

        self.stdout.write(self.style.SUCCESS('\n--- Deleting Peluches ---'))
        peluches = list(Peluch.objects.filter(slug__startswith=FAKE_SLUG_PREFIX))
        peluch_count = len(peluches)
        for peluch in peluches:
            peluch.delete()
        self.stdout.write(self.style.SUCCESS(f'{peluch_count} Peluches deleted'))

        self.stdout.write(self.style.SUCCESS('\n--- Deleting Blogs ---'))
        blogs = [blog for blog in Blog.objects.all() if is_fake_blog_title(blog.title)]
        blog_count = len(blogs)
        for blog in blogs:
            blog.delete()
        self.stdout.write(self.style.SUCCESS(f'{blog_count} Blogs deleted'))

        self.stdout.write(self.style.SUCCESS('\n--- Deleting Users ---'))
        users_to_delete = User.objects.filter(
            email__iendswith=f'@{FAKE_EMAIL_DOMAIN}',
            is_superuser=False,
            is_staff=False,
        )
        user_count = users_to_delete.count()
        users_to_delete.delete()
        self.stdout.write(self.style.SUCCESS(f'{user_count} Users deleted'))

        self.stdout.write(self.style.SUCCESS('\n--- Deleting Catalog Base Data ---'))
        category_count = Category.objects.filter(slug__startswith=FAKE_SLUG_PREFIX).count()
        color_count = GlobalColor.objects.filter(slug__startswith=FAKE_SLUG_PREFIX).count()
        size_count = GlobalSize.objects.filter(slug__startswith=FAKE_SLUG_PREFIX).count()

        Category.objects.filter(slug__startswith=FAKE_SLUG_PREFIX).delete()
        GlobalColor.objects.filter(slug__startswith=FAKE_SLUG_PREFIX).delete()
        GlobalSize.objects.filter(slug__startswith=FAKE_SLUG_PREFIX).delete()

        self.stdout.write(self.style.SUCCESS(f'{category_count} Categories deleted'))
        self.stdout.write(self.style.SUCCESS(f'{color_count} Colors deleted'))
        self.stdout.write(self.style.SUCCESS(f'{size_count} Sizes deleted'))

        protected_count = User.objects.filter(is_superuser=True).count() + User.objects.filter(
            is_staff=True,
            is_superuser=False,
        ).count()
        self.stdout.write(self.style.WARNING(f'{protected_count} Admin/Superuser accounts protected and not deleted'))
        self.stdout.write(self.style.SUCCESS('\n==== Fake Data Deletion Complete ===='))

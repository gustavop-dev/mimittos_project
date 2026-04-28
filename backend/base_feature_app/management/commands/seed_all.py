"""
One-shot seed for the full MIMITTOS dev/demo environment.

Runs in order:
  1. seed_featured    – categories with Unsplash images + 4 featured peluches with real images
  2. seed_demo        – demo user (demo@mimittos.com / Demo1234!) + 3 sample orders
                        (also seeds any missing categories, colors, sizes, peluches)
  3. seed_analytics   – 30 days of fake page-views and order analytics
  4. seed_color_images – per-peluch-color placeholder images for the gallery switcher
  5. SiteContent      – promo banner (ticker) + hero image placeholder

Usage:
    cd backend && source venv/bin/activate

    python manage.py seed_all                         # full seed, idempotent
    python manage.py seed_all --reset                 # wipe peluches/orders first, then re-seed
    python manage.py seed_all --skip-analytics        # skip analytics (faster)
    python manage.py seed_all --skip-color-images     # skip color images (faster)
    python manage.py seed_all --skip-featured         # skip Unsplash downloads (offline mode)

Notes:
  - seed_featured requires internet access (Unsplash). Use --skip-featured when offline.
  - seed_peluches is intentionally NOT included here — it's destructive (deletes everything).
  - This command is idempotent: running it twice won't duplicate data.
"""

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction


PROMO_BANNER = {
    'is_active': True,
    'message': '🎁 Envío gratis en compras mayores a $200.000  ·  Peluches hechos a mano en Colombia  ·  Personalización incluida',
    'bg_color': '#D4848A',
    'text_color': '#fff',
}

HERO_IMAGE_PLACEHOLDER = 'https://images.unsplash.com/photo-1558603668-6570496b66f8?w=1400&q=80'


class Command(BaseCommand):
    help = 'Seed the full dev/demo dataset with a single command'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Pass --reset to seed_demo (wipes peluches, orders and demo user first)',
        )
        parser.add_argument(
            '--skip-featured',
            action='store_true',
            help='Skip seed_featured (avoids Unsplash downloads — use when offline)',
        )
        parser.add_argument(
            '--skip-analytics',
            action='store_true',
            help='Skip seeding analytics data (faster)',
        )
        parser.add_argument(
            '--skip-color-images',
            action='store_true',
            help='Skip generating per-color placeholder images (faster)',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n🧸  MIMITTOS — seed_all\n'))

        total_steps = 5
        step = 0

        # ── 1. Featured categories + peluches with real images ───────────────
        step += 1
        if options['skip_featured']:
            self.stdout.write(f'⏭  Step {step}/{total_steps} — seed_featured (skipped, --skip-featured)')
        else:
            self.stdout.write(self.style.MIGRATE_HEADING(f'▶  Step {step}/{total_steps} — seed_featured'))
            self.stdout.write('   (downloads category images + featured peluche images from Unsplash)\n')
            try:
                call_command('seed_featured')
            except Exception as e:
                self.stdout.write(self.style.WARNING(
                    f'   ⚠ seed_featured failed: {e}\n'
                    f'   Continuing without featured images. Re-run without --skip-featured when online.'
                ))

        # ── 2. Demo user + orders ────────────────────────────────────────────
        step += 1
        self.stdout.write(self.style.MIGRATE_HEADING(f'\n▶  Step {step}/{total_steps} — seed_demo'))
        demo_kwargs = {}
        if options['reset']:
            demo_kwargs['reset'] = True
        call_command('seed_demo', **demo_kwargs)

        # ── 3. Analytics ─────────────────────────────────────────────────────
        step += 1
        if options['skip_analytics']:
            self.stdout.write(f'⏭  Step {step}/{total_steps} — seed_analytics (skipped)')
        else:
            self.stdout.write(self.style.MIGRATE_HEADING(f'\n▶  Step {step}/{total_steps} — seed_analytics'))
            call_command('seed_analytics')

        # ── 4. Color images ──────────────────────────────────────────────────
        step += 1
        if options['skip_color_images']:
            self.stdout.write(f'⏭  Step {step}/{total_steps} — seed_color_images (skipped)')
        else:
            self.stdout.write(self.style.MIGRATE_HEADING(f'\n▶  Step {step}/{total_steps} — seed_color_images'))
            call_command('seed_color_images')

        # ── 5. SiteContent (promo banner + hero image) ───────────────────────
        step += 1
        self.stdout.write(self.style.MIGRATE_HEADING(f'\n▶  Step {step}/{total_steps} — SiteContent'))
        self._seed_site_content()

        self.stdout.write(self.style.SUCCESS('\n✅  seed_all complete!\n'))
        self.stdout.write('   👤  demo@mimittos.com  /  Demo1234!\n')
        self.stdout.write('   🎀  Promo banner activa en el sitio\n\n')

    @transaction.atomic
    def _seed_site_content(self):
        from base_feature_app.models import SiteContent

        banner, created = SiteContent.objects.get_or_create(
            key=SiteContent.Key.PROMO_BANNER,
            defaults={'content_json': PROMO_BANNER},
        )
        if not created:
            banner.content_json = PROMO_BANNER
            banner.save(update_fields=['content_json', 'updated_at'])
        label = '✓ creado' if created else '✓ actualizado'
        self.stdout.write(f'  SiteContent [{label}] promo_banner')

        hero, hero_created = SiteContent.objects.get_or_create(
            key=SiteContent.Key.HERO_IMAGE,
            defaults={'content_json': {'image_url': HERO_IMAGE_PLACEHOLDER}},
        )
        if not hero_created and not hero.content_json.get('image_url'):
            hero.content_json = {'image_url': HERO_IMAGE_PLACEHOLDER}
            hero.save(update_fields=['content_json', 'updated_at'])
        label = '✓ creado' if hero_created else '· ya existe'
        self.stdout.write(f'  SiteContent [{label}] hero_image')

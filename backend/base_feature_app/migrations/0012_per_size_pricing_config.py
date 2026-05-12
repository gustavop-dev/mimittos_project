import django.core.validators
from django.db import migrations, models


def copy_pricing_to_sizes(apps, schema_editor):
    PeluchSizePrice = apps.get_model('base_feature_app', 'PeluchSizePrice')
    to_update = []
    for sp in PeluchSizePrice.objects.select_related('peluch').all():
        sp.deposit_percentage = sp.peluch.deposit_percentage
        sp.full_payment_discount_pct = sp.peluch.full_payment_discount_pct
        sp.free_shipping = sp.peluch.free_shipping
        sp.shipping_cost = sp.peluch.shipping_cost
        to_update.append(sp)
    if to_update:
        PeluchSizePrice.objects.bulk_update(
            to_update,
            ['deposit_percentage', 'full_payment_discount_pct', 'free_shipping', 'shipping_cost'],
        )


def copy_pricing_back_to_peluch(apps, schema_editor):
    Peluch = apps.get_model('base_feature_app', 'Peluch')
    PeluchSizePrice = apps.get_model('base_feature_app', 'PeluchSizePrice')
    for peluch in Peluch.objects.all():
        first = (
            PeluchSizePrice.objects
            .filter(peluch=peluch)
            .order_by('size__sort_order')
            .first()
        )
        if first:
            peluch.deposit_percentage = first.deposit_percentage
            peluch.full_payment_discount_pct = first.full_payment_discount_pct
            peluch.free_shipping = first.free_shipping
            peluch.shipping_cost = first.shipping_cost
            peluch.save(update_fields=[
                'deposit_percentage', 'full_payment_discount_pct', 'free_shipping', 'shipping_cost',
            ])


class Migration(migrations.Migration):

    dependencies = [
        ('base_feature_app', '0011_order_amount_paid_now_order_discount_amount_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='peluchsizeprice',
            name='deposit_percentage',
            field=models.PositiveSmallIntegerField(
                default=50,
                help_text='% del precio que se cobra como anticipo (modalidad contraentrega) para esta talla.',
                validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(100)],
            ),
        ),
        migrations.AddField(
            model_name='peluchsizeprice',
            name='full_payment_discount_pct',
            field=models.PositiveSmallIntegerField(
                default=0,
                help_text='% de descuento si el cliente paga el total por adelantado, para esta talla.',
                validators=[django.core.validators.MaxValueValidator(100)],
            ),
        ),
        migrations.AddField(
            model_name='peluchsizeprice',
            name='free_shipping',
            field=models.BooleanField(
                default=False,
                help_text='Si está activo, esta talla no aporta costo de envío.',
            ),
        ),
        migrations.AddField(
            model_name='peluchsizeprice',
            name='shipping_cost',
            field=models.PositiveIntegerField(
                default=0,
                help_text='Costo de envío en COP para esta talla. Se ignora si free_shipping=True.',
            ),
        ),
        migrations.RunPython(copy_pricing_to_sizes, copy_pricing_back_to_peluch),
        migrations.RemoveField(model_name='peluch', name='deposit_percentage'),
        migrations.RemoveField(model_name='peluch', name='full_payment_discount_pct'),
        migrations.RemoveField(model_name='peluch', name='free_shipping'),
        migrations.RemoveField(model_name='peluch', name='shipping_cost'),
    ]

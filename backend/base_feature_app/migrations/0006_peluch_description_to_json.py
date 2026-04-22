import json

from django.db import migrations, models


def text_to_json_array(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("SELECT id, description FROM base_feature_app_peluch")
        rows = cursor.fetchall()
        for pk, desc in rows:
            json_val = json.dumps([desc], ensure_ascii=False) if desc else '[]'
            cursor.execute(
                "UPDATE base_feature_app_peluch SET description = %s WHERE id = %s",
                [json_val, pk],
            )


class Migration(migrations.Migration):

    dependencies = [
        ('base_feature_app', '0005_category_globalcolor_globalsize_order_and_more'),
    ]

    operations = [
        migrations.RunPython(text_to_json_array, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='peluch',
            name='description',
            field=models.JSONField(blank=True, default=list),
        ),
    ]

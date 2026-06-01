from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("materials", "0002_documentchunk_embedding"),
    ]

    operations = [
        migrations.AddField(
            model_name="audiotranscription",
            name="metadata",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]

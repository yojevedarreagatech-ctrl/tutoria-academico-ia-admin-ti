import pgvector.django
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("materials", "0001_initial"),
    ]

    operations = [
        pgvector.django.VectorExtension(),
        migrations.AddField(
            model_name="documentchunk",
            name="embedding",
            field=pgvector.django.VectorField(blank=True, dimensions=1536, null=True),
        ),
    ]

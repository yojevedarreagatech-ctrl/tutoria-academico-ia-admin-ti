from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("quizzes", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="quiz",
            name="description",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="quiz",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, default=None),
            preserve_default=False,
        ),
    ]

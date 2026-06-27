from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("institutions", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="institution",
            name="nipt",
            field=models.CharField(blank=True, max_length=50),
        ),
    ]

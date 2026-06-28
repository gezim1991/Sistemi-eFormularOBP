from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="notification",
            name="type",
            field=models.CharField(
                choices=[
                    ("form_submitted", "Formular i dorëzuar tek OPB"),
                    ("form_viewed", "Formular i parë nga OPB"),
                    ("form_downloaded", "Formular i shkarkuar nga OPB"),
                    ("generic", "Njoftim i përgjithshëm"),
                ],
                default="generic",
                max_length=30,
            ),
        ),
    ]

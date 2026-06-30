import csv
from pathlib import Path

from django.core.management.base import BaseCommand

from apps.cpv.models import CpvCode

DEFAULT_CSV = Path(__file__).resolve().parent.parent.parent / "data" / "cpv-codes.csv"


class Command(BaseCommand):
    help = "Import CPV codes from the bundled CSV file into the database"

    def add_arguments(self, parser):
        parser.add_argument("--file", default=str(DEFAULT_CSV), help="Path to the CPV codes CSV file")

    def handle(self, *args, **options):
        path = Path(options["file"])
        if not path.exists():
            self.stderr.write(self.style.ERROR(f"File not found: {path}"))
            return

        created = 0
        updated = 0
        skipped = 0

        with path.open(encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            fields = {name.strip(): name for name in (reader.fieldnames or [])}
            group_key = fields.get("group", "group")
            name_key = fields.get("name", "name")
            code_key = fields.get("code", "code")

            for row in reader:
                code = (row.get(code_key) or "").strip()
                name = (row.get(name_key) or "").strip()
                group = (row.get(group_key) or "").strip()
                if not code or not name:
                    skipped += 1
                    continue
                _, was_created = CpvCode.objects.update_or_create(
                    code=code,
                    defaults={"name": name, "group": group},
                )
                if was_created:
                    created += 1
                else:
                    updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Created: {created}, updated: {updated}, skipped: {skipped}"
            )
        )

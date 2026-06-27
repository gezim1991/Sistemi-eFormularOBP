# Production readiness

Ky frontend eshte gati per build/deploy si UI, por prodhimi real kerkon lidhjen me backend per autentikim, ruajtje formulari dhe PDF.

## Gati ne frontend

- Build prodhimi me `npm run build`.
- Kontroll i plote me `npm run check`.
- Role UI per AK, OPB dhe ADMIN.
- Panel OPB read-only: shikon dhe shkarkon formular.
- Formularët e rinj per OPB dalin ne krye dhe shenohen vizualisht.
- `VITE_API_BASE_URL` per te konfiguruar URL-ne e backend-it pa ndryshuar kod.
- Headers baze sigurie dhe `robots.txt` per te shmangur indeksimin publik.

## Duhet para prodhimit real

- Zevendesim i demo login me autentikim backend/session/token.
- Zevendesim i `localStorage` store me API reale.
- Shkarkim real PDF nga endpoint-i `downloadPdf`.
- Gjenerim PDF real nga backend ose sherbim i dedikuar.
- Upload real per dokumentin e firmosur.
- Audit trail: kush e pa, kur u shkarkua, kush ngarkoi dokumentin.
- Rregulla backend per role/permissions, jo vetem fshehje UI.

## Komanda verifikimi

```bash
npm run format
npm run typecheck
npm run lint
npm run build
```

Ose te gjitha bashke:

```bash
npm run check
```

## Env

Kopjo `.env.example` ne `.env.production` ose vendose ne platformen e deploy:

```bash
VITE_API_BASE_URL=/api
```

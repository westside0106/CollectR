# TCG Price Updater - Scheduled Function

Diese Supabase Edge Function aktualisiert automatisch die Preise aller TCG Items in der Datenbank.

## Features

- **Automatische tägliche Updates** für alle TCG Items
- **Batch Processing** (10 Items gleichzeitig)
- **Rate Limiting** (1 Sekunde Verzögerung zwischen Requests)
- **Smart Updates** - nur bei signifikanten Preisänderungen (>1% oder >0.50 EUR)
- **Automatisches Logging** in Price History
- **Multi-Game Support** (Pokémon, Yu-Gi-Oh!, Magic)

## Setup

### 1. Function deployen

```bash
supabase functions deploy tcg-price-updater
```

### 2. Cron Job einrichten (Option A: pg_cron)

Für automatische tägliche Ausführung mit pg_cron:

```sql
-- pg_cron Extension aktivieren (nur einmal nötig)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Cron Job erstellen (läuft täglich um 3:00 Uhr nachts)
SELECT cron.schedule(
  'tcg-daily-price-update',  -- Job Name
  '0 3 * * *',               -- Cron Expression (täglich um 03:00)
  $$
  SELECT
    net.http_post(
      url := 'https://oferxxqoeshilqhwtyqf.supabase.co/functions/v1/tcg-price-updater',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb
    ) as request_id;
  $$
);
```

**Wichtig**: Du musst `app.service_role_key` in PostgreSQL setzen:

```sql
-- Service Role Key als Setting speichern
ALTER DATABASE postgres SET app.service_role_key = 'dein-service-role-key-hier';
```

Den Service Role Key findest du in deinem Supabase Dashboard unter **Settings → API → service_role**.

### 3. Cron Job einrichten (Option B: Supabase CLI)

Alternativ kannst du auch den Supabase CLI Scheduler verwenden:

```bash
# In supabase/functions/tcg-price-updater/.supabase/schedule.json
{
  "schedule": "0 3 * * *",
  "timezone": "Europe/Berlin"
}
```

Dann deployen:

```bash
supabase functions deploy tcg-price-updater --with-schedule
```

### 4. Cron Expressions

- `0 3 * * *` - Täglich um 03:00 Uhr
- `0 */6 * * *` - Alle 6 Stunden
- `0 0 * * 0` - Jeden Sonntag um Mitternacht
- `0 0 1 * *` - Am 1. jeden Monats um Mitternacht

Online Generator: https://crontab.guru/

## Manuelle Ausführung

Du kannst die Function auch manuell aufrufen:

```bash
curl -X POST 'https://oferxxqoeshilqhwtyqf.supabase.co/functions/v1/tcg-price-updater' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

## Response Format

```json
{
  "message": "TCG price update completed",
  "total": 250,
  "updated": 45,
  "failed": 5,
  "skipped": 200,
  "timestamp": "2026-01-13T03:00:00.000Z"
}
```

- **total**: Anzahl der gefundenen TCG Items
- **updated**: Anzahl der aktualisierten Items
- **failed**: Anzahl der fehlgeschlagenen Updates
- **skipped**: Anzahl der übersprungenen Items (Preis änderte sich nicht signifikant)

## Monitoring

### Cron Jobs anzeigen

```sql
-- Alle Cron Jobs anzeigen
SELECT * FROM cron.job;

-- Job-Ausführungen anzeigen (letzte 10)
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

### Logs anschauen

In Supabase Dashboard:
1. Gehe zu **Functions** → **tcg-price-updater**
2. Klicke auf **Logs**
3. Filtere nach Datum/Zeit

Oder per CLI:

```bash
supabase functions logs tcg-price-updater --tail
```

## Performance

Die Function verarbeitet **10 Items pro Batch** mit **1 Sekunde Verzögerung** zwischen Requests.

**Geschätzte Laufzeit:**
- 100 Items: ~2-3 Minuten
- 500 Items: ~10-15 Minuten
- 1000 Items: ~20-25 Minuten

**Rate Limits:**
- Pokémon TCG API: 1000 requests/hour (ohne Key), 20,000 requests/day (mit Key)
- Mit Caching werden die meisten Requests aus dem Cache bedient

## Smart Update Logic

Die Function aktualisiert nur, wenn:

1. **Preisänderung > 1%** ODER
2. **Preisänderung > 0.50 EUR**

Beispiele:
- 10.00 EUR → 10.05 EUR: **Übersprungen** (0.5%, 0.05 EUR)
- 10.00 EUR → 10.15 EUR: **Aktualisiert** (1.5%, 0.15 EUR)
- 1.00 EUR → 1.60 EUR: **Aktualisiert** (60%, 0.60 EUR)
- 100.00 EUR → 100.40 EUR: **Übersprungen** (0.4%, 0.40 EUR)

Das spart API Calls und verhindert unnötige Updates bei Mini-Schwankungen.

## Troubleshooting

### Cron Job läuft nicht

```sql
-- Prüfe ob pg_cron aktiviert ist
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Prüfe ob Job existiert
SELECT * FROM cron.job WHERE jobname = 'tcg-daily-price-update';

-- Prüfe letzte Ausführungen
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'tcg-daily-price-update')
ORDER BY start_time DESC
LIMIT 5;
```

### Service Role Key fehlt

```sql
-- Prüfe ob Key gesetzt ist
SHOW app.service_role_key;

-- Wenn leer, setze ihn:
ALTER DATABASE postgres SET app.service_role_key = 'dein-key';

-- Reload Config
SELECT pg_reload_conf();
```

### Function Timeout

Supabase Edge Functions haben ein 150 Sekunden Timeout. Falls du mehr als ~1000 Items hast, splitte den Job in mehrere Batches:

```sql
-- Option 1: Mehrere Cron Jobs mit LIMIT/OFFSET
SELECT cron.schedule('tcg-update-batch-1', '0 3 * * *', $$ ... LIMIT 500 OFFSET 0 $$);
SELECT cron.schedule('tcg-update-batch-2', '0 4 * * *', $$ ... LIMIT 500 OFFSET 500 $$);

-- Option 2: Query in Function anpassen (limit bereits auf 1000 gesetzt)
```

## Kosten & API Limits

**Pokémon TCG API** (kostenlos):
- Ohne Key: 1000 requests/hour
- Mit Key: 20,000 requests/day
- Empfehlung: API Key registrieren unter https://dev.pokemontcg.io/

**Supabase Function Invocations** (inkludiert in Free Tier):
- 500,000 invocations/Monat (Free)
- 2,000,000 invocations/Monat (Pro)

**Database Operations**:
- Minimaler Impact durch Smart Update Logic
- Price History wächst linear (~1 Eintrag pro Update pro Item)

## Nächste Erweiterungen

- [ ] Email-Benachrichtigungen bei großen Preisänderungen
- [ ] Webhook-Support für externe Integrationen
- [ ] Statistiken-Dashboard für Update-Jobs
- [ ] Retry-Mechanismus für fehlgeschlagene Updates
- [ ] Collection-spezifische Update-Zeiten

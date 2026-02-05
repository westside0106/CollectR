# CollectR Backups

## Project Backup
- **Full project backup**: `/path/to/your/downloads/CollectR_backup_20260106_172410.tar.gz` (472KB)
- Created: 2026-01-06 17:24:10
- Excludes: node_modules, .next, git objects

## Database Backup

### Quick Backup (Recommended)
```bash
./scripts/backup-database.sh
```

### Manual Backup via Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your CollectR project
3. Navigate to: Database → Backups
4. Click "Download" for the latest backup
5. Save to: `backups/db/`

### Manual Backup via pg_dump
If you have direct database access:
```bash
pg_dump -h db.YOUR_PROJECT.supabase.co -U postgres -d postgres > backups/db/collectr_backup_$(date +%Y%m%d_%H%M%S).sql
```

## Restore Instructions

### Restore Project Files
```bash
cd /path/to/your/downloads
tar -xzf CollectR_backup_20260106_172410.tar.gz
cd CollectR_clean
npm install
```

### Restore Database
```bash
# Via Supabase CLI
supabase db reset
psql -h db.YOUR_PROJECT.supabase.co -U postgres -d postgres < backups/db/your_backup.sql

# Or via Supabase Dashboard
# Database → SQL Editor → paste backup SQL → Run
```

## Automated Backups
Consider setting up automated backups:
- Supabase offers daily automated backups (check your plan)
- You can schedule the backup script with cron/launchd

## Notes
- Keep backups in a separate location (external drive, cloud storage)
- Test restores periodically to ensure backups are valid
- Database backups include: collections, items, service_costs, user data

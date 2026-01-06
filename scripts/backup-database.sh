#!/bin/bash

# Database Backup Script for CollectR (Supabase)
# Usage: ./scripts/backup-database.sh

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/db"
BACKUP_FILE="${BACKUP_DIR}/collectr_db_backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting database backup..."
echo "Timestamp: $TIMESTAMP"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed."
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Method 1: Using Supabase CLI (if linked to project)
echo "Attempting to backup using Supabase CLI..."
if supabase db dump -f "$BACKUP_FILE" 2>/dev/null; then
    echo "✓ Database backup created successfully!"
    echo "Location: $BACKUP_FILE"
    ls -lh "$BACKUP_FILE"
else
    echo ""
    echo "Note: Supabase CLI backup failed. This is normal if:"
    echo "1. You haven't linked your local project: supabase link --project-ref YOUR_PROJECT_REF"
    echo "2. You're using a hosted Supabase instance"
    echo ""
    echo "Alternative backup methods:"
    echo ""
    echo "METHOD 1 - Via Supabase Dashboard:"
    echo "  1. Go to https://app.supabase.com"
    echo "  2. Select your project"
    echo "  3. Go to Database → Backups"
    echo "  4. Click 'Download' for the latest backup"
    echo ""
    echo "METHOD 2 - Using pg_dump (requires database credentials):"
    echo '  pg_dump -h db.YOUR_PROJECT.supabase.co -U postgres -d postgres > '"$BACKUP_FILE"
    echo "  (You'll be prompted for the database password)"
    echo ""
    echo "METHOD 3 - Export via SQL Editor in Supabase Dashboard:"
    echo "  Run: COPY (SELECT * FROM your_table) TO STDOUT WITH CSV HEADER;"
    echo ""
fi

echo ""
echo "Backup process completed at: $(date)"

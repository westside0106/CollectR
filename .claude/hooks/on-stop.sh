#!/usr/bin/env bash
# on-stop.sh – Läuft nach jeder Claude-Antwort.
# Legt eine Session-Vorlage für heute an, falls noch keine existiert.
# Füllt sie nicht aus – das macht Claude am Ende der Session selbst.

set -euo pipefail

TODAY=$(date +%Y-%m-%d)
FILE="memory/sessions/${TODAY}.md"

# Nichts tun wenn memory/ nicht existiert (Submodule nicht initialisiert)
if [ ! -d "memory" ]; then
  exit 0
fi

# Vorlage nur anlegen wenn Datei noch nicht existiert
if [ ! -f "$FILE" ]; then
  mkdir -p memory/sessions
  cat > "$FILE" <<EOF
---
date: ${TODAY}
tags: [session]
---

# Session ${TODAY}

## Was wurde gemacht

## Offene Punkte

## Nächste Schritte
EOF
fi

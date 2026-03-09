---
tags: [dashboard]
updated: 2026-03-04
---

# CollectR Memory Vault

> Dieses Vault ist das persistente Gedächtnis von Claude Code für das CollectR-Projekt.
> Claude liest diese Dateien zu Beginn jeder Session automatisch.

---

## Navigation

| Datei | Inhalt |
|-------|--------|
| [[project]] | Tech Stack, Schema, Konventionen |
| [[todos]] | Offene TODOs mit Prioritäten |
| [[decisions]] | Architektur-Entscheidungen |
| [[lessons]] | Lessons Learned & Debugging-Guides |

---

## Sessions

```dataview
LIST
FROM "sessions"
SORT file.name DESC
LIMIT 10
```

*(Ohne Dataview Plugin: Dateien im `sessions/` Ordner manuell öffnen)*

---

## iPhone Setup (iCloud, kostenlos)

1. Auf dem Mac: Diesen Ordner (`collectr_memory`) in `iCloud Drive/` ablegen
   ```bash
   cp -r ~/path/to/collectr_memory ~/Library/Mobile\ Documents/com~apple~CloudDocs/collectr_memory
   ```
2. **Obsidian Mobile** aus dem App Store laden (kostenlos)
3. Obsidian → „Vault öffnen" → „Ordner öffnen" → `iCloud Drive/collectr_memory` wählen
4. Fertig — iCloud synct neue Dateien automatisch aufs iPhone

> **Sync-Workflow:** Nach jeder Session `git push` im collectr_memory Ordner →
> Mac zieht Änderungen automatisch → iCloud überträgt sie aufs iPhone

---

## Wie Claude diesen Vault nutzt

```
Session startet:
  → Claude liest CLAUDE.md (automatisch, im CollectR Repo Root)
  → Claude liest memory/project.md (Kontext)
  → Claude liest memory/todos.md (Was ist offen?)
  → Claude liest memory/sessions/DATUM.md (Was war zuletzt?)

Session endet:
  → Claude schreibt Session-Summary nach memory/sessions/HEUTE.md
  → git add -A && git commit -m "session DATUM" && git push
    (im memory/ Ordner ausführen)
```

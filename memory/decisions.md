---
tags: [decisions, architecture]
updated: 2026-03-04
---

# Architektur-Entscheidungen

## App Router statt Pages Router
**Entscheidung:** Next.js App Router (nicht Pages Router)
**Grund:** SSR-Middleware für Supabase Auth, Route Groups für Spheres, Server Components

## Supabase statt eigenem Backend
**Entscheidung:** Supabase (PostgreSQL + Auth + RLS + Storage + Realtime)
**Grund:** RLS direkt auf DB-Ebene, keine eigene Auth-Logik, Realtime out of the box

## RLS für alle Tabellen
**Entscheidung:** Alle Tabellen haben RLS ENABLED, keine Policy = kein Zugriff
**Grund:** Defense in depth – selbst wenn API-Key leakt, kein Datenzugriff ohne Auth

## rate_limits: Kein User-Zugriff (nur service_role)
**Entscheidung:** RLS enabled, keine Policies → nur Edge Functions (service_role) schreiben
**Grund:** User soll Rate-Limit-Status nicht manipulieren können

## Edge Functions: Fail Open bei Rate-Limit-Fehler
**Entscheidung:** Wenn `check_rate_limit()` RPC fehlschlägt → Request trotzdem durchlassen
**Grund:** Verfügbarkeit > Sicherheit bei temporärem DB-Problem

## CORS: Env-Variable statt Hardcoded localhost
**Entscheidung:** `ALLOWED_DEV_ORIGINS` Env-Var steuert lokale Origins
**Grund:** Prod-Build hat nie localhost erlaubt; Dev braucht es nur lokal

## Submodule für Memory Vault
**Entscheidung:** `collectr_memory` privates Repo als Git Submodule in `memory/`
**Grund:** Memory/Session-Daten bleiben privat, Claude Code sieht sie als normalen Ordner

## items.images als ARRAY (text[])
**Entscheidung:** Mehrere Bilder pro Item als PostgreSQL Array, nicht separate Tabelle
**Grund:** Einfachere Queries, item_images Tabelle existiert parallel für sort_order

## _computed_value für VK-Preis
**Entscheidung:** Feldname `_computed_value` für Verkaufswert
**Grund:** Historisch so benannt; NICHT umbenennen ohne Migration

## Spheres als Next.js Route Groups
**Entscheidung:** `/(tcg)/tcg/`, `/(gaming)/gaming/` etc.
**Grund:** Eigene Layouts, Stats-Hooks, Navigation pro Sphere ohne URL-Einfluss

## PWA statt Native App
**Entscheidung:** Next.js PWA (Service Worker, Manifest) statt React Native
**Grund:** Ein Codebase für Web + iOS + Android, kein App Store nötig

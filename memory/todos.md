---
tags: [todos]
updated: 2026-03-09
---

# Offene TODOs

## Hohe Priorität

- [ ] **Alpha Vantage Key** in Vercel eintragen → `ALPHA_VANTAGE_API_KEY`
  - Kostenlos holen: https://www.alphavantage.co/support/#api-key
  - Danach: Aktienpreise im Portfolio-Tracker live

- [ ] **E-Mail Versand** (ShareModal): Supabase Edge Function + Resend/SendGrid
  - Aktuell: Placeholder, keine echte E-Mail wird verschickt
  - Betrifft: `src/components/ShareModal.tsx`

- [ ] **Supabase Keys rotieren?**
  - Prüfen ob `.env.local` jemals öffentlich war (Audit-Empfehlung)

- [ ] **Leaked Password Protection**: Im Supabase Dashboard aktivieren (2 Klicks)

## Mittlere Priorität

- [ ] **Eigene News-Quellen pro User** (Custom RSS/Suchwörter)
  - Nächste Iteration der News-Seite
  - User speichert eigene Suchwörter → personalisierter Feed

- [ ] **Währungskonvertierung**: EK/VK-Summen in Stats-Bar ignorieren Nicht-EUR Währungen
  - TODOs in `src/hooks/useTCGStats.ts`, `useGamingStats.ts`

- [ ] **Gaming Wishlist**: Zeigt Placeholder-Daten, echte DB-Anbindung fehlt

- [ ] **Gaming/Geo Scanner**: Barcode-Lookup + AI Cover-Erkennung (TODO im Code)

- [ ] **User-Email in ShareModal**: Zeigt nur `user_id.slice(0,8)`
  - Braucht Edge Function für `auth.users` Zugriff

- [ ] **Server-side Image Compression**: Aktuell client-side, sollte server-side sein

## Niedrige Priorität

- [ ] Sentry/LogRocket Integration (Placeholder in `src/lib/logger.ts`)
- [ ] Item-Duplikate erkennen
- [ ] Filter-State in URL speichern (für Sharing)
- [ ] Deck-Counter in TCG Stats (`src/hooks/useTCGStats.ts`)
- [ ] Git-Historie bereinigen (git-filter-repo)
- [ ] ALLOWED_DEV_ORIGINS in `supabase/functions/.env` setzen (lokal)

---

## Zuletzt erledigt (Session 2026-03-09)

- ✅ Currency API: currencylayer → frankfurter.app (kein Key, EZB-Kurse)
- ✅ News API: gnews.io → Google News RSS (kein Key)
- ✅ Discogs User-Agent Domain auf collectorssphere.com korrigiert
- ✅ Books: Open Library durch Next.js API-Proxy geleitet (kein CORS)
- ✅ Portfolio-Tracker: DB-Migration `user_portfolio_holdings` (manuell applied)
- ✅ Portfolio-Tracker: API-Routen `/api/portfolio/holdings` + `/prices`
- ✅ Portfolio-Tracker: UI (AddHoldingModal + PortfolioTab in /tools/market)
- ✅ Alle Tool-Seiten redesigned: Gradient Hero + Dark Mode + Collectorssphere Design
- ✅ Build-Fix: /s Regex-Flag durch [\s\S] ersetzt

## Zuletzt erledigt (Session 2026-03-04)

- ✅ CORS: localhost aus Edge Functions entfernt (via ALLOWED_DEV_ORIGINS Env-Var)
- ✅ Rate Limiting für analyze-image (10 req/IP/h) und tcg-price-lookup (60 req/IP/h)
- ✅ Migration 20260304_create_rate_limits.sql erstellt
- ✅ Obsidian Memory Vault Setup

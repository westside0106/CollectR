---
tags: [project, context]
updated: 2026-03-04
---

# CollectR – Projekt-Kontext

## Was ist CollectR?
PWA zur Verwaltung von Sammlungen (Hot Wheels, TCG, Vinyl, Gaming, Geologie, etc.)
mit spezialisiertem Multi-Sphere-System. Installierbar auf iOS/Android.

## Tech Stack
| Layer | Technologie |
|-------|-------------|
| Frontend | Next.js 16, React 19, TypeScript (strict) |
| Styling | Tailwind CSS 4 |
| Backend | Supabase (PostgreSQL, Auth, RLS, Realtime, Storage) |
| 3D | Three.js, React Three Fiber, GSAP |
| Deployment | Vercel (Auto-Deploy via GitHub main) |
| Edge Functions | Deno (Supabase Edge Functions) |

## Deployment
- **App URL:** collect-r.vercel.app
- Auto-Deploy bei Push auf `main`
- Edge Functions: Supabase (EU-Region)

---

## Datenbank – Wichtigste Konventionen

### `items` Tabelle (kritisch!)
```
images        → text[] ARRAY (NICHT image_url string!)
_computed_value → VK-Preis (Verkaufswert)
_value_currency → Währung des VK
purchase_price → EK-Preis (Einkaufspreis)
status        → 'in_collection' | 'sold' | 'lent' | 'wishlist' | 'ordered'
```

### `collections` Tabelle
```
settings      → jsonb (Custom Fields etc.)
owner_id      → uuid (FK → auth.users)
```

### Sharing-Tabellen
- `collection_members` – Rollen: `viewer` | `editor` | `admin`
- `collection_invitations` – E-Mail und Link-Einladungen

### RLS
- **Alle Tabellen** haben RLS ENABLED
- `rate_limits` Tabelle: kein User-Zugriff (nur service_role aus Edge Functions)

---

## Code-Konventionen

### createClient() – KRITISCH
```typescript
// FALSCH (verursacht Vercel Prerender-Fehler):
const supabase = createClient(...)  // Top-Level beim Modulimport

// RICHTIG:
useEffect(() => {
  const supabase = createClient(...)
}, [])
```

### iOS PWA Safe Area
```css
/* RICHTIG – direkt in Tailwind-Klasse: */
style={{ paddingTop: 'env(safe-area-inset-top)' }}

/* FALSCH – CSS-Variable funktioniert auf iOS nicht: */
--safe-top: env(safe-area-inset-top);  /* → wird ignoriert */
padding-top: var(--safe-top);
```

### Edge Functions CORS
```typescript
// Prod-Origins immer erlaubt
// Dev-Origins NUR via Env-Var (nie hartcodiert):
const devOrigins = Deno.env.get('ALLOWED_DEV_ORIGINS')
  ?.split(',').map(o => o.trim()).filter(Boolean) ?? []
```

---

## Spheres (Route-Gruppen)
| Sphere | Pfad | Status |
|--------|------|--------|
| TCG | `/(tcg)/tcg/` | Vollständig |
| Gaming | `/(gaming)/gaming/` | Teilweise |
| Geo | `/(geo)/geo/` | Stub |
| Official | `/(official)/official/` | Stub |
| Shop | `/(shop)/shop/` | Stub |

## Migrations-Überblick
Alle in `supabase/migrations/` – neueste: `20260304_create_rate_limits.sql`
(Rate Limiting für Edge Functions via `check_rate_limit()` RPC)

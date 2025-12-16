# CollectR Bug Fixes - Installation Guide

## 📦 Inhalt dieser ZIP-Datei

```
fixes/
├── new-item-page-fixed.tsx      # Fix: Bild-Upload beim Erstellen
├── categories-page-fixed.tsx    # Fix: Kategorie erstellen + Error Handling
├── fix-rls-policies.sql         # Fix: Supabase RLS Policies
└── README.md                    # Diese Datei
```

---

## 🔧 Installation

### Schritt 1: Dateien ersetzen

1. **new-item-page-fixed.tsx** kopieren nach:
   ```
   src/app/collections/[id]/items/new/page.tsx
   ```

2. **categories-page-fixed.tsx** kopieren nach:
   ```
   src/app/collections/[id]/categories/page.tsx
   ```

### Schritt 2: RLS Policies fixen (WICHTIG!)

1. Gehe zu **Supabase Dashboard** → **SQL Editor**
2. Öffne die Datei `fix-rls-policies.sql`
3. Kopiere den Inhalt und führe ihn aus
4. **Für Entwicklung:** Option A (RLS deaktivieren) ist bereits aktiv
5. **Für Produktion:** Kommentiere Option A aus und aktiviere Option B

### Schritt 3: Testen

1. `npm run dev` starten
2. Zur Kategorien-Seite gehen
3. Neue Kategorie erstellen → sollte jetzt funktionieren
4. Neues Item erstellen → Bilder-Upload sollte erscheinen

---

## 🐛 Was wurde gefixt?

### Bug 1: Kategorie erstellen funktioniert nicht
**Problem:** Button "Erstellen" hat nichts getan
**Ursache:** RLS Policy blockiert INSERT
**Lösung:** 
- SQL Script deaktiviert RLS temporär
- Zusätzlich: Besseres Error-Handling in der Seite

### Bug 2: Bild-Upload fehlt bei "Neues Item"
**Problem:** Im "Neues Item" Formular gab es keinen Bilder-Upload
**Ursache:** ImageUpload-Komponente war nicht eingebunden
**Lösung:**
- ImageUpload Komponente importiert
- State für pending images hinzugefügt
- Bilder werden nach Item-Erstellung hochgeladen

---

## 📝 Änderungen im Detail

### new-item-page-fixed.tsx
```diff
+ import { ImageUpload } from '@/components/ImageUpload'
+ const [pendingImages, setPendingImages] = useState<...>([])

  // Im JSX:
+ <div className="bg-white rounded-xl p-6 ...">
+   <ImageUpload onImagesChange={(images) => setPendingImages(images)} />
+ </div>

  // Nach Item-Insert:
+ if (pendingImages.length > 0) {
+   // Bilder hochladen...
+ }
```

### categories-page-fixed.tsx
```diff
+ const [error, setError] = useState<string | null>(null)
+ const [success, setSuccess] = useState<string | null>(null)

  // Bei createCategory:
  const { data, error } = await supabase...
+ if (error) {
+   console.error('Error creating category:', error)
+   setError(`Fehler: ${error.message}`)
+ }

  // Im JSX:
+ {error && <div className="bg-red-50 ...">{error}</div>}
+ {success && <div className="bg-green-50 ...">{success}</div>}
```

---

## ⚠️ Hinweise

- Nach dem Ändern der SQL Policies: **Seite neu laden!**
- Bei Problemen: Browser Console öffnen (F12) und Fehler prüfen
- Falls RLS weiter Probleme macht: Im Supabase Dashboard unter 
  Authentication → Policies die Einstellungen prüfen

---

## 🚀 Nächste Schritte (Mobile Responsive)

Diese Fixes beheben die kritischen Bugs. Für die Mobile-Responsive-Issues 
(Screenshot 1 & 2) ist ein separater Fix nötig:

1. iOS Safari Viewport (dvh statt vh)
2. Sidebar als Mobile Overlay
3. Dashboard Cards Grid

Das können wir in der nächsten Session angehen!

---

*Erstellt: Dezember 2024*

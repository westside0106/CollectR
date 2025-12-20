<p align="center">
  <img src="public/logo.png" alt="CollectR Logo" width="160" />
</p>

<h1 align="center">CollectR</h1>

<p align="center">
  <b>Your private digital collection archive.</b><br/>
  Clean • Secure • Structured
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue" />
  <img src="https://img.shields.io/badge/Status-Active-success" />
  <img src="https://img.shields.io/badge/Privacy-First-critical" />
</p>

---

## 🧭 Overview

**CollectR** is a private collection management app.  
It is designed as a **personal digital archive** for collectors who care about:

- structure  
- provenance  
- clarity  
- privacy  

No noise. No tracking. No bloat.

---

## ✨ Features

- 📦 Structured collections & items
- 🏷️ Metadata-first design
- 🔐 Privacy-first (no telemetry)
- ⚡ Fast UI with Next.js App Router
- 🧠 Strict TypeScript
- 🧼 Clean repository hygiene

---

## 🛠️ Tech Stack

| Layer | Technology |
|-----|------------|
| Framework | Next.js (App Router) |
| Language | TypeScript (strict) |
| Styling | CSS (Tailwind-ready) |
| Linting | ESLint (Next + TS) |
| Hosting | Vercel-compatible |
| Runtime | Node.js |

---

## 📂 Project Structure

```txt
CollectR/
├─ app/                # App Router pages & layouts
├─ components/         # Reusable UI components
├─ public/             # Static assets (logo, screenshots)
├─ styles/             # Global styles
├─ tsconfig.json
├─ eslint.config.mjs
├─ next.config.js
└─ README.md
```

---

## 🚀 Getting Started

### 1️⃣ Install dependencies

```bash
npm install
```

### 2️⃣ Run development server

```bash
npm run dev
```

Open 👉 http://localhost:3000

---

## 🔐 Environment & Security

- No secrets are committed
- `.env*`, `.next/`, `node_modules/`, `.vercel/` are ignored
- Designed for **local-first & private deployments**

### Example env file (not committed)

```env
# .env.example
NEXT_PUBLIC_APP_NAME=CollectR
```

---

## 🧼 Repository Hygiene

The repository intentionally excludes:

- Build output (`.next/`, `out/`, `build/`)
- Dependencies (`node_modules/`)
- Environment variables
- Logs & cache files

This ensures:

- clean commits
- readable diffs
- predictable deployments

---

## 🧠 Philosophy

> “CollectR feels like your personal digital museum archive.”

Minimal.  
Intentional.  
Private.

---

## 🗺️ Roadmap

- [ ] Advanced tagging
- [ ] Import / export
- [ ] Media attachments
- [ ] Collection analytics
- [ ] Offline-first support

---

## 📄 License

Private project – all rights reserved.

---

<p align="center">
  <sub>Built with care • Designed for collectors</sub>
</p>

# ARCHIVE FINDS — Full-Stack Platform & Automation System

A premier editorial discovery platform for curated archive pieces, rare garments, and designer fashion. Built to transform social media traffic (TikTok & Instagram) into verified Sugargoo affiliate conversions through an autonomous local background worker pipeline.

---

## 🏛 System Architecture

```
                               ┌────────────────────────────────┐
                               │       VERCEL (Cloud Host)      │
                               │                                │
                               │   Next.js 15+ App Router       │
                               │   - Public Editorial Store     │
                               │   - 2-Col Mobile Discovery     │
                               │   - Instant Fast Search        │
                               │   - /product/[slug] SEO Pages  │
                               │   - Minimalist Admin HUD       │
                               └───────────────┬────────────────┘
                                               │
                                               │ SQL Queries (Drizzle ORM)
                                               ▼
                               ┌────────────────────────────────┐
                               │     PostgreSQL Database        │
                               │   (Single Source of Truth)     │
                               │   - products                   │
                               │   - brands & categories        │
                               │   - sources & product_sources  │
                               │   - affiliate_links            │
                               │   - processing_jobs            │
                               └───────────────▲────────────────┘
                                               │
                                               │ Background Sync & Jobs
                                               │
                               ┌───────────────┴────────────────┐
                               │    LOCAL WINDOWS PC WORKER     │
                               │                                │
                               │ 1. Multi-Sheet Scanner (GS)    │
                               │ 2. 4-Tier Duplicate Engine     │
                               │ 3. Sugargoo Link Transformer   │
                               │ 4. Local Python rembg Cutout   │
                               │ 5. Sharp 9:16 Editorial Render │
                               │ 6. Multi-Tier File Storage     │
                               └────────────────────────────────┘
```

---

## 🚀 Quickstart & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Setup Python Background Removal (Local rembg)
```bash
pip install -r python/background_removal/requirements.txt
```

### 4. Run Next.js Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Mobile-First User Flow

1. **Social Entry:** TikTok / Instagram Slide-Post (featuring high-fashion 9:16 render).
2. **Link in Bio:** Direct landing on `/` or `/discover`.
3. **2-Column Mobile Feed:** Ultra-fast, zero-lag visual catalog with brand tags and price estimates.
4. **Product View (`/product/[slug]`):** High-resolution image showcase, taxonomy specifications, and fixed mobile conversion bar.
5. **Conversion CTA (`[ VIEW ITEM ]`):** Direct Sugargoo affiliate link navigation with tracking member ID.

---

## ⚡ 4-Tier Deduplication Pipeline

- **Level 1 (Exact URL Match):** Evaluates exact URL strings against database index.
- **Level 2 (Item ID Extraction):** Parses TaoBao, Weidian, and 1688 marketplace product IDs.
- **Level 3 (Normalized String Match):** Strips punctuation and brand prefixes for linguistic matching.
- **Level 4 (Image Perceptual Hash):** Architecture prepared for hamming distance similarity tests.

---

## 🛠 Admin & Worker HUD

Access the internal HUD at `/admin`:
- **Overview:** Active product metrics, health checks, and quick scan triggers.
- **Products:** Manage catalog status, view source linkages, and verify affiliate URLs.
- **Sheet Sources:** Add and configure Google Spreadsheet sources without modifying code.
- **Job Queue:** Real-time job monitor (`DOWNLOAD_IMAGE`, `REMOVE_BACKGROUND`, `GENERATE_IMAGE`, `CREATE_AFFILIATE`).

---

## 📁 Second Brain Synchronization

System architecture and directory mappings are actively maintained in:
- `D:\grepify (second brain)\01 - Projects\Archive Finds.md`
- `D:\grepify (second brain)\01 - Projects\Archive Finds\01 - File Structure.md`
- `D:\grepify (second brain)\01 - Projects\Archive Finds\02 - Architecture.md`

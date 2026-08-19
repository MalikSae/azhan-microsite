# AGENTS.md — Project Rules for AI Coding Agents (azhan-microsite)

File ini dibaca Antigravity di awal setiap sesi kerja di project `azhan-microsite`. Project ini TERPISAH dari `erp-azhan` (backend Go + Master Dashboard) — workspace berbeda, `AGENTS.md`/`design-system.md` milik `erp-azhan` TIDAK otomatis berlaku di sini.

Lihat juga `design-system-microsite.md` untuk aturan detail UI/warna/komponen.

---

## Project Overview

- **Nama**: Azhan Microsite — situs publik multi-brand (Alsha, Zahara, Athia, Hana, Nava)
- **Tipe**: Next.js App Router, 1 codebase melayani banyak domain lewat middleware resolve brand
- **Backend**: mengonsumsi API dari project `erp-azhan` (`http://localhost:9090` lokal), TIDAK punya database sendiri
- **Relasi dengan `erp-azhan`**: project terpisah, TAPI perubahan skema/kontrak API di backend (`erp-azhan`) bisa berdampak ke sini — kalau prompt menyebut perubahan field API publik, cek dulu apakah kode di sini (khususnya `src/lib/api.js`, `middleware.js`) perlu ikut disesuaikan

---

## Tech Stack

- **Framework**: Next.js (App Router), JavaScript (bukan TypeScript, konsisten dengan Master Dashboard)
- **Styling**: Tailwind CSS
- **Font**: DM Sans

---

## Arsitektur Multi-Brand (WAJIB dipahami sebelum ubah middleware/layout)

- `middleware.js` resolve brand dari hostname → fetch `GET {API_BASE_URL_INTERNAL}/api/public/brand?domain={hostname}` → set hasil sebagai **REQUEST headers** (`x-brand-id`, `x-brand-name`, `x-brand-whatsapp`, `x-brand-logo`, `x-brand-color`) yang diteruskan ke Server Component
- Header `x-brand-*` ini **TIDAK PERNAH terlihat di response header ke browser** (`curl -v` biasa) — itu NORMAL, bukan bug, karena sifatnya request header internal Next.js, bukan response header
- Fetch di middleware WAJIB `{ cache: 'no-store' }` — jangan biarkan Next.js cache hasil resolve brand (pernah jadi sumber bug: domain sudah benar di database tapi UI masih tampilkan versi lama karena ke-cache)
- Domain yang tidak terdaftar ATAU API gagal fetch apapun sebabnya → rewrite ke `/brand-not-found`, JANGAN biarkan error mentah/crash tampil ke publik

---

## Konvensi API

- Endpoint publik backend format error: `{"error": "pesan"}` — sama seperti `erp-azhan`
- `GET /api/schedules?brand={id}` **wajib** parameter `brand` — tidak ada fallback "semua brand" di endpoint publik
- Response publik TIDAK menyertakan field internal (`status`, `is_ticket_confirmed`, dll) — kalau field baru muncul di response API dan sepertinya internal-only, JANGAN diasumsikan aman ditampilkan ke publik tanpa konfirmasi dulu

---

## Testing & Verifikasi (WAJIB, sama ketatnya dengan project erp-azhan)

- **Setiap klaim "berhasil" WAJIB bukti mentah**: HTTP status + response body, atau HTML output dari `curl`, bukan ringkasan naratif
- **JANGAN screenshot browser sendiri kalau user secara eksplisit bilang akan test manual** — hormati itu, cukup laporkan hasil command-line (curl, build log, dll)
- Kalau ada dugaan bug (cache, race condition, dll), **investigasi dulu sebelum menyimpulkan penyebabnya** — jangan langsung terima teori pertama tanpa bukti (pola yang sudah terbukti berguna di project ini: cek `.next` cache, cek apakah backend jalan versi terbaru, cek data di database langsung)

---

## Safety Guardrails (Kritis)

- **JANGAN buat script yang mengubah data di database `erp_azhan_dev`** dari workspace ini tanpa izin eksplisit dan penjelasan detail — project ini seharusnya read-only terhadap data (cuma fetch), kalaupun perlu set data test (mis. isi `domain` brand), WAJIB jelaskan dulu apa yang akan diubah sebelum eksekusi, dan laporkan hasilnya transparan (bukan cuma "berhasil")
- **Jangan kill/restart proses di luar milik project ini** (mis. proses backend Go di port 9090, Nginx) tanpa menyebutkan eksplisit alasannya
- Migrasi database, kalau diperlukan, dilakukan di project `erp-azhan` (itu yang punya kepemilikan skema), BUKAN dari sini

---

## Responsive & Tipografi (WAJIB)

Prioritas mobile LEBIH TINGGI di sini dibanding dashboard internal — mayoritas trafik dari klik link WhatsApp/Instagram di HP. Test 375px dulu, baru 1440px (kebalikan urutan test di project `erp-azhan`).

---

## Communication

- Ringkas, langsung ke inti
- Ragu soal maksud instruksi → tanya, jangan menebak
- Temuan bug/celah di luar scope prompt saat ini → laporkan, jangan langsung diperbaiki tanpa dikonfirmasi

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

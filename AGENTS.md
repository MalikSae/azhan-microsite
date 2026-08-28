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

## Git Conventions (WAJIB — repo kolaboratif, ada kontributor lain)

Repo: github.com/MalikSae/azhan-microsite

- **SEMUA kerja WAJIB di branch `dev-malik`** — JANGAN PERNAH commit/push langsung ke `main`. Cek branch aktif di awal sesi, checkout/buat `dev-malik` dulu kalau belum aktif.
- Commit lokal boleh rutin, pesan deskriptif.
- **`git push` WAJIB minta konfirmasi eksplisit user setiap kali** — tidak pernah otomatis.
- **Setiap kali diminta commit & push, selalu cek status KEDUA repo (erp-azhan dan azhan-microsite), meskipun perubahan sesi ini cuma menyentuh satu repo — laporkan status repo yang tidak ada perubahan apa adanya (bersih), jangan diabaikan begitu saja.**

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

## Kontrak API — WAJIB dibaca sebelum sentuh field data apapun

**Ini sumber kebenaran paling akurat.** Bug paling sering terjadi di project ini adalah field mapping yang ditebak alih-alih dicek — SELALU cocokkan nama field PERSIS seperti di bawah, jangan asumsikan nama "yang masuk akal" (contoh nyata bug masa lalu: kode baca `schedule.hotel_makkah` padahal field aslinya `hotel_mekkah` — ejaan "e", bukan "a"; kode baca `schedule.airline` padahal field aslinya `maskapai`).

### `GET /api/schedules?brand={id}` — daftar paket (untuk landing page)

```json
{
  "id": 89,
  "jadwal_nama": "Umroh 9 Hari (Saudia)",
  "is_promo": false,
  "is_direct_flight": false,
  "seat_total": 45,
  "seat_sisa": 45,
  "maskapai": { "id": 7, "name": "SAUDIA", "logo_url": "/uploads/..." },
  "berangkat_tanggal": "2026-12-23",
  "berangkat_jam": "",
  "berangkat_kode_penerbangan": "",
  "pulang_tanggal": "2026-12-31",
  "pulang_jam": "",
  "pulang_kode_penerbangan": "",
  "hotel_mekkah": { "id": 10, "name": "AZKA SAFA", "star_rating": 5, "distance_m": 300 },
  "hotel_madinah": { "id": 11, "name": "ROYAL ANDALUS", "star_rating": 0, "distance_m": null },
  "harga_quad": 38999000,
  "harga_triple": 40999000,
  "harga_double": 43999000,
  "harga_coret": null,
  "itinerary_id": null,
  "include_items": ["Kereta Cepat Haramain", "City Tour Taif"],
  "exclude_items": [],
  "add_ons": [],
  "brosur_url": "",
  "brosur_thumb_url": ""
}
```

**Catatan penting per field (kasus yang PERNAH bikin bug, jangan diulang):**
- `maskapai`, `hotel_mekkah`, `hotel_madinah` = **object bersarang**, bukan string — ambil `.name`, bukan langsung dipakai sebagai teks
- `hotel_mekkah`/`hotel_madinah`.`star_rating` bisa bernilai **`0`** (bukan berarti "tidak ada bintang" secara otomatis — cek dulu sebelum render, `0` = data belum diisi admin, JANGAN render 0 bintang kosong, sembunyikan saja bagian rating)
- `.distance_m` bisa **`null`** — render "-" bukan "±nullm"
- `berangkat_jam`, `berangkat_kode_penerbangan`, `pulang_jam`, `pulang_kode_penerbangan` bisa **string kosong `""`** (bukan null) kalau admin belum isi — sembunyikan baris itu kalau kosong, JANGAN tampilkan strip kosong
- **"terisi"/"kuota"** WAJIB dihitung `seat_total - seat_sisa` — `seat_sisa` artinya SISA kursi yang BELUM terisi, BUKAN jumlah yang sudah terisi (ini pernah salah kaprah dan bikin progress bar+badge status kursi salah total)
- `harga_coret` cuma tampil kalau tidak null DAN lebih besar dari `harga_quad`
- Field ini TIDAK ADA di response publik (sengaja disembunyikan): `status`, `is_ticket_confirmed`, `brand_id`

### `GET /api/public/brand?domain={hostname}` — resolve domain ke identitas brand

```json
{
  "id": 4,
  "name": "Hana",
  "whatsapp_number": "6281234567890",
  "logo_url": "/uploads/brand-logos/....webp",
  "primary_color": "#990000"
}
```

Field brand LAIN (alamat, gmaps_url, legalitas, bank, sosmed) **ADA di database tapi BELUM di-expose lewat endpoint publik ini** — kalau butuh field itu (mis. untuk Footer), backend perlu diupdate dulu (whitelist field publik ada di `internal/brand/handler.go`, fungsi resolve-domain), JANGAN asumsikan field itu otomatis muncul di sini.

### `GET /api/itinerary/{id}` — detail itinerary (untuk modal)

```json
{
  "id": 3,
  "title": "Itinerary Umroh 9 Hari Reguler",
  "days": [
    { "title": "Hari 1 - Keberangkatan", "location": "Jakarta - Madinah",
      "activities": [{ "time": "18:00", "text": "Berkumpul di Bandara..." }] }
  ]
}
```

Endpoint ini **publik, tanpa auth** — aman dipanggil langsung dari client-side kalau perlu (bukan cuma server component).

---

## Cara Menjalankan (Development)

Urutan WAJIB, kalau salah satu belum jalan, request akan gagal/timeout:

1. **Backend Go** (`erp-azhan`, repo terpisah): `cd C:\laragon\www\erp-azhan && go run cmd/api/main.go` — port **9090**. Cek hidup: `curl http://localhost:9090/api/health`
2. **Next.js dev server** (project ini): `npm run dev` — port **3000**
3. **Nginx (Laragon)** — proxy `*.azhan.test` (port 80) ke `localhost:3000`. Config di `C:\laragon\etc\nginx\sites-enabled\azhan-multibrand.conf`. Kalau baru ubah config, restart Laragon manual (Stop All → Start All lewat tray icon) — TIDAK bisa direstart dari dalam Antigravity.
4. **Hosts file** (`C:\Windows\System32\drivers\etc\hosts`) harus punya baris `127.0.0.1  {brand}.azhan.test` untuk tiap domain brand yang mau dites.

**Cara akses saat development**: buka `http://{brand}.azhan.test` (BUKAN `http://localhost:3000` langsung — itu tidak match domain manapun di tabel `brands`, akan selalu jatuh ke halaman `/brand-not-found`, INI PERILAKU NORMAL bukan bug).

**Kalau UI menampilkan data lama/salah padahal backend sudah diupdate**: SELALU curigai fetch middleware/API belum pakai `{ cache: 'no-store' }`, atau proses `npm run dev` sebelumnya masih nyangkut di background (kill port 3000 dulu, restart bersih) — SEBELUM menyimpulkan itu bug logic baru.

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

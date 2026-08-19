# Design System — Azhan Microsite (Publik, Multi-Brand)

> Berlaku untuk project `azhan-microsite` (Next.js, terpisah dari `erp-azhan`). Berbeda dari design system Master Dashboard — situs ini publik, warna brand **dinamis per domain**, dan mobile-first jauh lebih kritis (mayoritas trafik dari klik link WhatsApp/Instagram).

---

## 1. Prinsip

**Dilarang keras hardcode UI** — sama seperti aturan Master Dashboard, DENGAN 2 PENGECUALIAN SAH:

1. **Warna brand (`--brand-primary`)** — ini DATA dinamis dari database (beda tiap domain: navy Alsha, gold Athia, dst), disuntikkan lewat CSS custom property di `layout.jsx` dari header `x-brand-color` yang di-set middleware. Dipakai lewat utility class `.bg-brand`, `.text-brand`, `.border-brand` (didefinisikan di `globals.css`) — BUKAN ditulis ulang sebagai `bg-[#hex]` di tiap komponen.
2. **Warna hijau WhatsApp** di `WhatsAppButton.jsx` — brand color resmi pihak ketiga, bukan token desain sistem kita.

Di luar 2 pengecualian itu: semua warna WAJIB lewat token semantik (`neutral-*`, `success-*`, `warning-*`, `danger-*`) di `tailwind.config.js` — **JANGAN** pakai `slate-*`/`gray-*`/`green-*` Tailwind bawaan langsung (ini pelanggaran yang sudah terjadi di scaffold awal, perlu diperbaiki).

---

## 2. Warna

### 2.1 Brand (dinamis, lihat Prinsip #1)
Tidak ada scale statis — 1 warna per brand (`primary_color` dari tabel `brands`), diakses via `var(--brand-primary)` / class `.bg-brand`, `.text-brand`, `.border-brand`.

### 2.2 Neutral (statis — alias dari Tailwind slate, TAPI wajib lewat nama token)
```js
// tailwind.config.js
colors: {
  neutral: colors.slate, // reuse scale Tailwind, tapi WAJIB dipanggil "neutral-*" di komponen, bukan "slate-*"
}
```

### 2.3 Semantic status (statis, TIDAK ikut brand — sama di semua brand)
| Token | Pemakaian |
|---|---|
| `success-*` | SeatProgressBar kondisi aman (<80% terisi) |
| `warning-*` | SeatProgressBar hampir penuh (≥80%), Badge "PROMO" |
| `danger-*` | Pesan error fetch/API gagal |

---

## 3. Tipografi

- `font-body`: DM Sans (konsisten dengan Master Dashboard — 1 identitas font platform, warna yang beda-beda per brand)
- Skala responsive WAJIB (lihat bagian 5) — situs publik diakses HP jauh lebih sering daripada dashboard internal, jangan pakai ukuran statis desktop

---

## 4. Komponen (`src/components/`)

Reorganisasi folder yang direkomendasikan (kalau belum, rapikan saat sentuh area ini):

```
src/components/
  ui/                    ← atom generik, reusable lintas halaman
    Button.jsx
    Badge.jsx
    Card.jsx
    EmptyState.jsx
    LoadingState.jsx
  PackageCard.jsx        ← komponen fitur, spesifik microsite
  SearchBar.jsx
  SortDropdown.jsx
  SeatProgressBar.jsx
  WhatsAppButton.jsx
```

| Komponen | Catatan |
|---|---|
| `PackageCard` | Pakai `.bg-brand`/`.text-brand` untuk elemen bermerek (harga, aksen), warna status (badge promo, seat bar) TETAP token semantik statis |
| `SeatProgressBar` | Warna hijau/oranye SELALU semantik (aman/hampir penuh), TIDAK PERNAH pakai `--brand-primary` — status kursi bukan identitas brand |
| `WhatsAppButton` | Pengecualian warna hijau resmi WhatsApp, dicatat di komentar kode |
| `Button`, `Badge`, `Card` (kalau belum ada di `ui/`) | Buat dulu sebelum dipakai berulang di banyak tempat — jangan styling one-off per halaman |

---

## 5. Responsive & Breakpoint

Sama seperti aturan Master Dashboard (breakpoint default Tailwind, mobile-first), TAPI prioritasnya lebih tinggi di sini:

- **Test mobile (375px) WAJIB jadi prioritas utama**, desktop (1440px) sekunder — kebalikan urutan prioritas dari dashboard internal
- Grid kartu paket: 1 kolom di mobile, 2-3 kolom di `md:`/`lg:` ke atas
- Header/navigasi: logo brand + judul harus tetap proporsional di layar sempit, JANGAN overflow horizontal

---

## 6. SEO & Performa (spesifik microsite, tidak relevan untuk dashboard)

- **Server Component sebagai default** — hindari `'use client'` kecuali benar-benar butuh interaktivitas (search/sort/filter state). Halaman utama (`page.jsx`) tetap Server Component untuk data paket, supaya konten ada di HTML awal (SEO)
- Gambar (logo brand, foto hotel, brosur) WAJIB pakai `alt` text deskriptif, bukan kosong
- `generateMetadata` di tiap halaman WAJIB set `<title>` dan `description` sesuai brand aktif (sudah diimplementasikan di layout.jsx, pertahankan pola ini di halaman baru)

---

## 7. Alur Kerja Komponen Baru

1. Cek dulu `src/components/ui/` — kalau atom yang dibutuhkan (Button, Badge, Card, dst) sudah ada, reuse
2. Kalau belum ada, buat DULU di `ui/`, baru dipakai di komponen fitur/halaman
3. Elemen bermerek (warna brand) → `.bg-brand`/`.text-brand`. Elemen status/semantik → token `success`/`warning`/`danger`. Elemen netral → token `neutral`. TIDAK ADA kombinasi lain yang sah.

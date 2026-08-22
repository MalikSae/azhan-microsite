# Azhan Microsite — Multi-Brand Public Site & Portal Jamaah

Situs publik dan portal mandiri jamaah multi-brand berbasis **Next.js (App Router)** yang terintegrasi langsung dengan backend ERP Azhan (`erp-azhan`). Menggunakan arsitektur multi-tenant domain-driven, di mana 1 codebase dan 1 instance aplikasi dapat melayani banyak brand travel umrah (Alsha, Zahara, Athia, Hana, Nava) dengan branding dinamis per domain.

---

## 🌟 Fitur Utama

### 1. Landing Page & Katalog Paket Umrah (`/`)
- **Katalog Jadwal Dinamis**: Menampilkan paket keberangkatan aktif sesuai brand yang sedang diakses.
- **Pencarian, Filter & Urutan**: Filter berdasarkan bulan/tahun keberangkatan, paket promo, serta sorting harga terendah/tertinggi atau jadwal terdekat.
- **Detail Paket & Itinerary**: Modal rincian perjalanan harian yang mengambil data itinerary publik dari backend.
- **Fasilitas Paket**: Tampilan dua kolom untuk fasilitas yang sudah termasuk dan belum termasuk agar mudah dipindai.
- **Rute Penerbangan Lengkap**: Menampilkan alur berangkat dan pulang secara utuh, termasuk titik transit jika tersedia.
- **Kapasitas Kursi Real-Time**: Visual progress bar ketersediaan seat dengan indikator semantik (tersedia, hampir penuh, sold out).
- **Integrasi WhatsApp**: Tombol konsultasi langsung ke nomor WhatsApp resmi masing-masing brand dengan pesan template otomatis.

### 2. Perbandingan Paket (`/compare`)

- Tombol compare pada kartu paket langsung membuka halaman perbandingan dan memilih paket tersebut.
- Paket pembanding dapat dipilih dari daftar paket lain pada brand yang sama.
- Perbandingan head-to-head menampilkan nama, jadwal, harga, maskapai, hotel, fasilitas, kapasitas, serta itinerary.
- Rute penerbangan disusun sebagai alur pergi → transit → tujuan dan rute pulang dalam baris yang sejajar.

### 3. Portal Jamaah Mandiri (`/portal`)
- **Autentikasi Jamaah (`/portal/login`)**: Login cepat dan aman menggunakan Nama Lengkap dan ID Jamaah / No Registrasi yang tervalidasi per brand.
- **Dashboard Jamaah (`/portal`)**:
  - Ringkasan profil dan riwayat pendaftaran paket.
  - Status perjalanan jamaah (Progress Timeline).
  - Akses cepat ke detail paket dan checklist kelengkapan.
- **Detail Booking & Riwayat Pembayaran (`/portal/booking/[id]`)**:
  - Rincian biaya paket, total yang sudah dibayar, dan sisa tagihan.
  - Riwayat riil transaksi pembayaran (DP, cicilan, pelunasan).
- **Konfirmasi Transfer Manual (`/portal/pembayaran`)**:
  - Jamaah memilih salah satu rekening resmi yang aktif untuk brandnya.
  - Form mencatat booking, nominal, tanggal, nama/bank pengirim, dan bukti transfer.
  - Pengajuan berstatus menunggu sampai dikonfirmasi atau ditolak oleh pusat/admin brand.
- **Upload & Verifikasi Dokumen (`/portal/booking/[id]`)**:
  - Checklist dokumen wajib (Paspor, Foto Jamaah, KTP/KK, Buku Nikah, Kartu Kuning/Vaksin Meningitis).
  - Upload berkas langsung ke storage backend dengan preview status (Belum Upload, Menunggu Verifikasi, Terverifikasi, Ditolak).

### 4. Fallback & Safe Routing (`/brand-not-found`)
- Halaman penanganan otomatis jika domain yang diakses tidak terdaftar di database brand atau API backend tidak merespons.

---

## 🏗️ Arsitektur Multi-Brand

Aplikasi ini menggunakan resolusi brand otomatis di level **Next.js Middleware** (`src/middleware.js`):

```mermaid
flowchart LR
    Browser([Browser Request]) --> Middleware[src/middleware.js]
    Middleware -->|GET /api/public/brand?domain=host| Backend[(ERP Backend :9090)]
    Backend -->|Brand Data: ID, Nama, Warna, WA, Logo| Middleware
    Middleware -->|Set Internal Request Headers| AppRouter[Next.js App Router]
    Middleware -.->|404 / Error| NotFound[/brand-not-found]
    AppRouter --> Layout[src/app/layout.jsx]
    Layout -->|Inject var --brand-primary| UI[Dynamic Branded UI]
```

1. **Host Header Resolution**: Middleware membaca domain dari header `Host` atau `X-Forwarded-Host`.
2. **Fetch Brand Metadata**: Mengambil metadata brand dari endpoint publik backend `{API_BASE_URL_INTERNAL}/api/public/brand?domain={hostname}` dengan `{ cache: 'no-store' }`.
3. **Internal Header Forwarding**: Hasil resolve disuntikkan ke **Request Headers** internal (`x-brand-id`, `x-brand-name`, `x-brand-whatsapp`, `x-brand-logo`, `x-brand-color`).
4. **Dynamic CSS Variables**: Root layout (`src/app/layout.jsx`) membaca header dan menginjeksi `--brand-primary` ke tag `<html>` / `<body>`, sehingga warna tema berubah otomatis tanpa perlu build/deploy terpisah.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, JavaScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Typography**: DM Sans (`font-body`)
- **Icons**: [Lucide Icons](https://lucide.dev/) (SVG)
- **Backend API**: Golang REST API (`erp-azhan`)

---

## 📁 Struktur Direktori

```
azhan-microsite/
├── public/                     # Static assets (logo placeholder, favicon)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── brand-not-found/    # Fallback page saat domain tidak terdaftar
│   │   ├── compare/            # Perbandingan paket secara head-to-head
│   │   ├── design-system/      # Halaman preview token & komponen UI
│   │   ├── portal/             # Rute Portal Jamaah
│   │   │   ├── booking/[id]/   # Rincian booking, pembayaran, & upload dokumen
│   │   │   ├── login/          # Form login jamaah
│   │   │   ├── layout.jsx      # Layout portal dengan proteksi auth & navigasi
│   │   │   └── page.jsx        # Dashboard utama portal jamaah
│   │   ├── globals.css         # Tailwind directives & CSS custom properties
│   │   ├── layout.jsx          # Root layout & penyuntik tema brand dinamis
│   │   └── page.jsx            # Landing page publik & katalog jadwal
│   ├── components/             # Reusable UI & Feature components
│   │   ├── ui/                 # Atom UI (Button, Badge, EmptyState)
│   │   ├── ItineraryModal.jsx  # Modal detail hari & agenda itinerary
│   │   ├── FacilitiesModal.jsx # Fasilitas termasuk dan belum termasuk
│   │   ├── ComparePackagesClient.jsx # UI dan state perbandingan paket
│   │   ├── PackageCard.jsx     # Card jadwal paket umrah
│   │   ├── PackageListClient.jsx # Wrapper client-side untuk search/filter/sort
│   │   ├── ProgressTimeline.jsx# Timeline status proses jamaah
│   │   ├── SearchBar.jsx       # Input pencarian paket
│   │   ├── SeatProgressBar.jsx # Indikator ketersediaan kursi
│   │   ├── SortDropdown.jsx    # Dropdown urutan paket
│   │   └── WhatsAppButton.jsx  # Tombol CTA WhatsApp
│   ├── context/
│   │   ├── BrandContext.jsx    # React context untuk data brand di client
│   │   └── PortalAuthContext.jsx # State autentikasi sesi portal jamaah
│   ├── lib/
│   │   ├── api.js              # Client fetch jadwal publik
│   │   └── portalApi.js        # Service client untuk portal (auth, booking, dokumen)
│   └── middleware.js           # Multi-tenant domain resolver & rewrite handler
├── .env.local                  # Environment variables lokal
├── AGENTS.md                   # Panduan aturan coding agent AI
├── design-system.md            # Dokumentasi standar UI/UX & design token
├── next.config.mjs             # Next.js configuration
├── package.json
└── tailwind.config.js
```

---

## ⚙️ Environment Variables

Buat file `.env.local` di root proyek:

```env
# URL API backend yang diakses dari browser / Client Component
NEXT_PUBLIC_API_BASE_URL=http://localhost:9090

# URL API backend yang diakses dari Server Component & Middleware Next.js
API_BASE_URL_INTERNAL=http://localhost:9090
```

---

## 🚀 Memulai Pengembangan

### 1. Prasyarat
- **Node.js**: v18.18+ atau v20+
- **Backend API**: Project `erp-azhan` berjalan di port `9090` (`http://localhost:9090`)
- **Database & Domain Test**: Pastikan tabel `brands` di backend memiliki domain lokal untuk pengujian (misal: `alsha.azhan.test`, `hana.azhan.test`, atau `localhost:3000`).

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Menjalankan Server Development
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) atau akses melalui virtual host domain brand yang sudah diarahkan ke port dev Next.js (misal melalui Nginx / Laragon reverse proxy).

### 4. Build untuk Produksi
```bash
npm run build
npm run start
```

---

## 🔗 Integrasi Backend (`erp-azhan`)

Endpoint backend utama yang dikonsumsi oleh microsite:

| Endpoint | Method | Keterangan |
|---|---|---|
| `/api/public/brand?domain={host}` | `GET` | Mengambil info brand berdasarkan hostname di middleware |
| `/api/schedules?brand={brandId}` | `GET` | Mengambil daftar jadwal paket umrah publik per brand |
| `/api/itineraries/{id}` | `GET` | Mengambil itinerary publik beserta agenda perjalanan |
| `/api/portal/login` | `POST` | Login jamaah via Nama & ID Jamaah |
| `/api/portal/me` | `GET` | Profil jamaah aktif |
| `/api/portal/bookings` | `GET` | Daftar booking milik jamaah |
| `/api/portal/bookings/{id}` | `GET` | Detail booking, paket, & hotel |
| `/api/portal/bookings/{id}/payments` | `GET` | Riwayat pembayaran & mutasi transaksi |
| `/api/portal/bank-accounts` | `GET` | Rekening transfer aktif untuk brand jamaah |
| `/api/portal/bookings/{id}/payments` | `POST` | Kirim konfirmasi transfer manual beserta bukti |
| `/api/portal/dokumen` | `GET` / `POST` | Daftar & perbarui status dokumen jamaah |
| `/api/portal/media/upload` | `POST` | Upload file fisik dokumen jamaah |

---

## 🎨 Panduan Desain & Aturan Kode

- **Warna Brand**: Menggunakan class `.bg-brand`, `.text-brand`, dan `.border-brand` yang merujuk ke custom property `var(--brand-primary)`.
- **Warna Status**: Menggunakan token semantik standar Tailwind (`success`, `warning`, `danger`). Status kursi dan status pembayaran tidak boleh memakai warna brand dinamis.
- **Responsive Portal**: Portal memakai bottom navigation dan layout mobile-first pada layar kecil, lalu sidebar serta area konten multi-kolom pada desktop. Prioritaskan pengujian pada viewport 375px dan 1440px.
- **Tanpa Shadow Berlebihan**: Shell utama menggunakan struktur border dan latar yang bersih; hindari box-shadow besar yang membuat UI terlihat seperti perangkat tiruan.
- Detail lengkap dapat dibaca di [`design-system.md`](./design-system.md) dan [`AGENTS.md`](./AGENTS.md).

---

## Checklist Integrasi

Sebelum menguji microsite, pastikan:

1. Backend `erp-azhan` berjalan di `http://localhost:9090`.
2. Migrasi backend `001` sampai `027` sudah diterapkan.
3. Brand memiliki domain, warna, nomor WhatsApp, serta paket berstatus `published`.
4. Paket sudah terhubung ke hotel, maskapai, itinerary, fasilitas, dan data rute penerbangan.
5. Jalankan `npm run build` untuk memastikan seluruh route, termasuk `/compare`, berhasil dikompilasi.

---

## Deployment VPS dengan aaPanel (Dari Awal Sampai Online)

Panduan ini mengasumsikan backend `erp-azhan` sudah online di `https://api.example.com`. Contoh microsite memakai wildcard `*.example.com` agar satu instance melayani seluruh brand.

### 1. DNS dan prasyarat

1. Buat A record `@` dan wildcard `*` menuju IP VPS. Jika microsite hanya memakai subdomain tertentu, buat A record untuk setiap domain tersebut.
2. Instal **Nginx** dan **Node.js Manager** pada aaPanel.
3. Gunakan Node.js 20/22 LTS dan instal PM2 melalui Node.js Manager atau terminal.
4. Pastikan setiap hostname produksi sudah tersimpan pada field domain brand di ERP, persis tanpa protokol dan path.

### 2. Clone dan konfigurasi

```bash
cd /www/wwwroot
git clone https://github.com/MalikSae/azhan-microsite.git
cd azhan-microsite
git checkout master
npm ci
cp .env.example .env.local 2>/dev/null || touch .env.local
nano .env.local
```

Isi environment produksi:

```env
# Dipakai browser pengunjung
NEXT_PUBLIC_API_BASE_URL=https://api.example.com

# Dipakai server Next.js dan middleware; gunakan localhost bila satu VPS
API_BASE_URL_INTERNAL=http://127.0.0.1:9090
```

`NEXT_PUBLIC_API_BASE_URL` ditanam saat build. Perubahan nilainya mengharuskan build ulang. `API_BASE_URL_INTERNAL` harus dapat dijangkau proses Node dan tidak perlu dibuka ke internet.

### 3. Build dan jalankan dengan PM2

```bash
npm run build
pm2 start npm --name azhan-microsite -- start -- -p 3000
pm2 save
pm2 startup
```

Jalankan perintah lanjutan yang dicetak oleh `pm2 startup` agar aplikasi otomatis hidup setelah reboot. Alternatifnya gunakan fitur **Node Project** aaPanel dengan startup command `npm run start -- -p 3000`, user `www`, dan working directory `/www/wwwroot/azhan-microsite`.

### 4. Website wildcard dan reverse proxy

1. Tambahkan website `example.com` pada aaPanel dan sertakan domain wildcard `*.example.com`.
2. Atur **Reverse Proxy** ke `http://127.0.0.1:3000`.
3. Pastikan Nginx meneruskan hostname asli karena middleware menggunakannya untuk menentukan brand:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

4. Untuk upload dokumen dan bukti transfer, naikkan batas request di blok `server`:

```nginx
client_max_body_size 30m;
proxy_read_timeout 120s;
```

### 5. SSL wildcard

Wildcard SSL membutuhkan validasi DNS. Pada menu SSL aaPanel pilih Let's Encrypt DNS verification untuk `example.com` dan `*.example.com`, masukkan API DNS provider jika didukung, lalu aktifkan **Force HTTPS**. Jika setiap brand memakai domain berbeda, terbitkan sertifikat untuk setiap domain atau gunakan layanan proxy/CDN yang mengelola SSL masing-masing.

### 6. Verifikasi deployment

```bash
pm2 status
pm2 logs azhan-microsite --lines 100
curl -I -H 'Host: alsha.example.com' http://127.0.0.1:3000
curl -I https://alsha.example.com
curl -i 'https://api.example.com/api/public/brand?domain=alsha.example.com'
```

Periksa alur lengkap pada viewport 375px dan 1440px: landing page, paket, compare, login portal, booking, dokumen, pembayaran, dan profil. Domain yang belum terdaftar memang harus menuju `/brand-not-found`.

### 7. Prosedur update

```bash
cd /www/wwwroot/azhan-microsite
git pull --ff-only origin master
npm ci
npm run build
pm2 restart azhan-microsite --update-env
pm2 save
```

Jangan commit `.env.local`, `.next`, log PM2, atau credential DNS/SSL. Backup source tidak menggantikan backup database dan folder upload milik repository ERP.

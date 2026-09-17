# LAPORAN KESIAPAN CODEBASE: FITUR AGEN UMROH
**(Program Referral & Komisi Bertingkat Terbatas)**

**Target Sistem**: `erp-azhan` (Backend Go REST API & Dashboard React Monorepo)  
**Terkait**: `azhan-microsite` (Next.js Multi-Brand Public Microsite)  
**Sifat Investigasi**: Murni Read-Only (Audit Skema Database, Auth Scoping, Modul Booking/CRM, Dashboard React, dan Tooling)  
**Tanggal**: 17 September 2026  

---

## Ringkasan Eksekutif

Hasil audit menyeluruh terhadap repositori `erp-azhan` menunjukkan bahwa fondasi **multi-brand tenant scoping** (pemisahan data berbasis `brand_id`) dan **monorepo frontend React** (`master-dashboard`, `travel-dashboard`, `shared`) sudah berjalan dengan sangat baik dan matang.

Namun, untuk domain bisnis **Agen Umroh, Relasi Upline (1-tier), Pencatatan Kode Referral, dan Perhitungan Komisi (Direct, Upline Bonus, Repeat Order, Cashback)**, sistem saat ini **berada pada status greenfield (belum ada tabel maupun fungsi bisnis di backend)**. Satu-satunya jejak yang ditemukan adalah *placeholder UI* halaman `/komisi` di `master-dashboard` dan banner teaser Syiar di microsite. 

Kendala arsitektur utama yang ditemukan adalah **constraint `UNIQUE (email)` global pada tabel `admin_users`**, yang saat ini belum mendukung aturan bisnis di mana satu orang dapat mendaftar sebagai agen di lebih dari satu brand dengan akun terpisah.

---

## BAGIAN 1 — SKEMA DATABASE SAAT INI

Pemeriksaan skema dilakukan langsung pada database `erp_azhan_dev` (MySQL 8.4) dan seluruh berkas migrasi `migrations/001_*.sql` s/d `migrations/058_*.sql`.

### 1.1 Keberadaan Tabel Agen, Komisi, dan CRM Lead

Hasil query `SHOW TABLES FROM erp_azhan_dev`:
- Tabel `AGEN` / `agen`: **TIDAK ADA / NIHIL**.
- Tabel `KOMISI` / `komisi`: **TIDAK ADA / NIHIL**.
- Tabel `CRM_LEAD` / `crm_lead`: **TIDAK ADA tabel tersendiri untuk master prospek**.
- **Tabel Sepadan yang Ditemukan**: Ditemukan tabel **`crm_deal_requests`** yang dibuat melalui migrasi `migrations/035_crm_atomic_deals.sql`. Tabel ini mencatat transaksi konversi lead menjadi deal secara atomik dan idempoten.

#### Kutipan Skema Persis: `crm_deal_requests`
*(Sumber: `migrations/035_crm_atomic_deals.sql`)*

```sql
CREATE TABLE crm_deal_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  brand_id BIGINT UNSIGNED NOT NULL,
  crm_lead_id CHAR(36) NOT NULL,
  idempotency_key CHAR(36) NOT NULL,
  request_hash CHAR(64) NOT NULL,
  status ENUM('processing','completed') NOT NULL DEFAULT 'processing',
  jamaah_id BIGINT UNSIGNED NULL,
  booking_id BIGINT UNSIGNED NULL,
  payment_id BIGINT UNSIGNED NULL,
  response_payload JSON NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_crm_deal_idempotency (idempotency_key),
  UNIQUE KEY uq_crm_deal_lead (brand_id, crm_lead_id),
  CONSTRAINT fk_crm_deal_brand FOREIGN KEY (brand_id) REFERENCES brands(id),
  CONSTRAINT fk_crm_deal_jamaah FOREIGN KEY (jamaah_id) REFERENCES jamaah(id),
  CONSTRAINT fk_crm_deal_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
  CONSTRAINT fk_crm_deal_payment FOREIGN KEY (payment_id) REFERENCES payments(id),
  CONSTRAINT fk_crm_deal_created_by FOREIGN KEY (created_by) REFERENCES admin_users(id)
) ENGINE=InnoDB;
```

---

### 1.2 Struktur Tabel `USER` (`admin_users`), `ROLE`, dan `BRAND`

Sistem tidak memiliki tabel bernama `users` atau `roles`. Pengguna sistem backoffice disimpan dalam tabel `admin_users`, dan role disimpan sebagai kolom bertipe `ENUM`.

#### Kutipan Skema Persis: `admin_users`
*(Sumber: `SHOW CREATE TABLE admin_users`)*

```sql
CREATE TABLE `admin_users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand_id` bigint unsigned DEFAULT NULL,
  `role` enum('admin','cs') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_admin_users_brand_role_active` (`brand_id`,`role`,`is_active`),
  CONSTRAINT `admin_users_ibfk_1` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Karakteristik Role & Scoping Brand**:
- **Super Admin**: Memiliki nilai `brand_id = NULL` dan `role = 'admin'`. Memiliki hak akses penuh lintas brand (*unrestricted scope*).
- **Admin Travel**: Memiliki `brand_id` spesifik dan `role = 'admin'`. Hak akses dibatasi (*scoped*) hanya untuk data brand tersebut.
- **CS (Customer Service)**: Memiliki `brand_id` spesifik dan `role = 'cs'`. Dibatasi hanya dapat mengakses endpoint integrasi CRM.
- **Role 'agen'**: Belum terdaftar pada `ENUM('admin','cs')`.

#### Kutipan Skema Persis: `brands`
*(Sumber: `SHOW CREATE TABLE brands`)*

```sql
CREATE TABLE `brands` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `domain` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `whatsapp_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `province` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gmaps_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `legalitas` text COLLATE utf8mb4_unicode_ci,
  `ppiu_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pihk_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `akreditasi` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_holder` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `social_facebook` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `social_instagram` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `social_tiktok` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `social_youtube` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `primary_color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_title` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `og_image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `google_verification_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `kode_brand` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jamaah_counter` int unsigned NOT NULL DEFAULT '0',
  `minimal_dp` double NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `domain` (`domain`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 1.3 Audit Istilah "referral", "upline", "kode_referral", "komisi"

Pencarian menyeluruh di seluruh skema SQL dan kode sumber Go menghasilkan status sebagai berikut:
1. **Di Database & Kode Backend Go (`migrations/`, `internal/`)**: **NIHIL (0 kecocokan)**. Sama sekali belum ada tabel, kolom, fungsi, struct, atau konstanta yang menggunakan istilah-istilah tersebut.
2. **Di Frontend React (`frontend/master-dashboard`)**: **DITEMUKAN jejak placeholder**:
   - Menu Sidebar: `frontend/master-dashboard/src/components/Sidebar.jsx`:
     ```javascript
     { name: 'Komisi & Referral', path: '/komisi', icon: Percent, status: 'inactive' }
     ```
   - Halaman Placeholder: `frontend/master-dashboard/src/pages/KomisiReferralPage.jsx`:
     ```jsx
     const KomisiReferralPage = () => {
       return (
         <div>
           <PageHeader title="Komisi & Referral" />
           <Card>
             <p className="text-neutral-600 font-body">Segera hadir: modul untuk Komisi & Referral.</p>
           </Card>
         </div>
       );
     };
     ```
   - Routing: `frontend/master-dashboard/src/App.jsx` baris 79-80 mendaftarkan rute `<Route path="/komisi" element={<KomisiReferralPage />} />`.

---

## BAGIAN 2 — AUTH & MULTI-TENANT SCOPING

### 2.1 Implementasi JWT & Claim `brand_id`

Autentikasi di backend Go dikelola oleh package `internal/identity`. Token JWT ditandatangani menggunakan algoritma HS256 dengan secret key dari variabel `JWT_SECRET`.

#### Pembuatan Token (`internal/identity/jwt.go`)
```go
// Kutipan asli: internal/identity/jwt.go (baris 45-63)
func GenerateAccessToken(adminUserID int64, brandID *int64, role string, emails ...string) (string, error) {
	now := time.Now()
	ttl := getAccessTTL()
	claims := jwt.MapClaims{
		"sub":      adminUserID,
		"brand_id": brandID,
		"role":     role,
		"type":     "access",
		"jti":      uuid.New().String(),
		"exp":      now.Add(ttl).Unix(),
		"iat":      now.Unix(),
	}
	if len(emails) > 0 && emails[0] != "" {
		claims["email"] = emails[0]
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getJWTSecret())
}
```

#### Ekstraksi Token di Middleware (`internal/identity/middleware.go`)
Middleware mengekstrak header `Authorization: Bearer <token>`, memvalidasi klaim `type == "access"`, lalu menyuntikkan informasi identitas ke dalam `context.Context`:

```go
// Kutipan asli: internal/identity/middleware.go (baris 21-44)
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		adminUserID, brandID, role, err := ValidateToken(tokenString, "access")
		if err != nil {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		ctx := context.WithValue(r.Context(), AdminUserIDKey, adminUserID)
		ctx = context.WithValue(ctx, BrandIDKey, brandID)
		ctx = context.WithValue(ctx, RoleKey, role)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
```

Fungsi helper konteks:
- `identity.GetBrandID(ctx) *int64`: Mengembalikan pointer `*int64` jika admin terikat brand, atau `nil` jika Super Admin.
- `identity.GetRole(ctx) string`: Mengembalikan `"admin"` atau `"cs"`.
- `identity.GetAdminUserID(ctx) int64`: Mengembalikan ID user pengakses.

---

### 2.2 Pola Row-Level Scoping per `brand_id` di Query

Pola isolasi data multi-tenant diterapkan secara eksplisit di layer repository (*Raw SQL Builder*), bukan melalui ORM global filter.

**Modul Rujukan**: `internal/jamaah/repository.go` dan `internal/booking/repository.go`.

#### Pola Query Scoping pada Operasi Baca (List & GetByID):
```go
// Kutipan asli: internal/jamaah/repository.go (baris 131-137)
	var args []interface{}
	if brandID != nil {
		q += " AND brand_id = ?"
		args = append(args, *brandID)
	}
```
- Jika `brandID != nil` (Admin Brand / CS): Klausa `AND brand_id = ?` wajib ditambahkan dan parameternya di-*bind*. User tidak bisa melihat baris data milik brand lain.
- Jika `brandID == nil` (Super Admin): Klausa filter tidak ditambahkan, sehingga query mengembalikan data seluruh brand.

#### Pola Query Scoping pada Operasi Tulis (Create & Update):
Pada operasi pembuatan record, nilai `brand_id` diambil dari context token (`*brandID`). Jika pemanggil adalah Super Admin (`brandID == nil`), `brand_id` wajib disertakan di payload request body.

---

### 2.3 Constraint Unique di Tabel Pengguna (Kasus Akun Lintas Brand)

Berdasarkan aturan bisnis: *Satu orang bisa menjadi agen di lebih dari satu brand, tetapi wajib memakai akun terpisah per brand.*

Berikut perbandingan constraint pada tabel pengguna saat ini:

1. **Tabel `admin_users`**:
   - Memiliki index: `UNIQUE KEY email (email)`.
   - **Implikasi**: **Satu email yang sama TIDAK BISA didaftarkan dua kali** di tabel `admin_users`, bahkan untuk `brand_id` yang berbeda. Jika seseorang ingin mendaftar sebagai admin/staff di dua brand berbeda, saat ini sistem menolaknya (*Duplicate entry*).
   - Tabel `admin_users` juga tidak memiliki kolom `phone` atau `no_hp`.

2. **Perbandingan dengan Tabel `jamaah`**:
   - Tabel `jamaah` sudah mengadopsi model multi-brand phone scoping:
     ```sql
     UNIQUE KEY `uq_jamaah_brand_phone` (`brand_id`, `no_hp`)
     ```
   - Pada tabel `jamaah`, nomor HP yang sama **boleh terdaftar berulang kali selama `brand_id`-nya berbeda**. Namun untuk NIK jamaah, index-nya bersifat unik global (`UNIQUE KEY nik (nik)`).

---

## BAGIAN 3 — MODUL BOOKING & CRM YANG SUDAH ADA

### 3.1 Struktur Tabel `BOOKING` & Alur Status

#### Kutipan Skema Persis: `bookings`
*(Sumber: `SHOW CREATE TABLE bookings`)*

```sql
CREATE TABLE `bookings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_booking` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `schedule_id` bigint unsigned NOT NULL,
  `pic_jamaah_id` bigint unsigned DEFAULT NULL,
  `status` enum('draft','baru','dp','lunas','batal') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'baru',
  `is_seat_blocked` tinyint(1) NOT NULL DEFAULT '0',
  `seat_hold_expires_at` datetime DEFAULT NULL,
  `seat_hold_key` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_harga` decimal(12,0) DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `progress_hotel` tinyint(1) NOT NULL DEFAULT '0',
  `progress_land_arrangement` tinyint(1) NOT NULL DEFAULT '0',
  `seat_count` smallint unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_id_booking` (`id_booking`),
  KEY `schedule_id` (`schedule_id`),
  KEY `created_by` (`created_by`),
  KEY `fk_bookings_pic_jamaah` (`pic_jamaah_id`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`),
  CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `admin_users` (`id`),
  CONSTRAINT `fk_bookings_pic_jamaah` FOREIGN KEY (`pic_jamaah_id`) REFERENCES `jamaah` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=134 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Alur Status Booking (`bookings.status`):
- `draft`: Dibuat saat calon jamaah memesan secara mandiri (self-booking melalui microsite) sebelum pembayaran uang muka.
- `baru`: Booking resmi terbuat oleh admin/CRM tetapi belum ada pembayaran DP terkonfirmasi.
- `dp`: Uang muka minimum telah diverifikasi oleh keuangan; kursi paket resmi diblokir (*seat blocked*).
- `lunas`: Seluruh akumulasi pembayaran valid telah mencapai atau melampaui `total_harga`.
- `batal`: Booking dibatalkan atau batas waktu reservasi kursi sementara (*seat hold*) kedaluwarsa.

#### Kolom yang Tersedia untuk Dikaitkan ke Prospek/Referral:
- Di tabel `bookings` saat ini **BELUM ADA kolom untuk agen atau referral** (seperti `agent_id`, `upline_agent_id`, `referral_code`, atau `komisi_amount`).
- Kolom relasi yang tersedia saat ini:
  - `pic_jamaah_id`: Menghubungkan booking ke jamaah penanggung jawab.
  - `created_by`: ID user admin yang menginput booking.
  - `schedule_id`: ID jadwal keberangkatan paket.
  - `seat_hold_key`: Token reservasi kursi sementara (UUID) yang dipakai saat transaksi CRM.

---

### 3.2 Modul CRM (`internal/crmdeal`)

Di backend Go `erp-azhan`, modul CRM yang tersedia adalah **`internal/crmdeal`** (didukung oleh endpoint `POST /api/admin/crm/deals`).

#### Mekanisme Pencatatan Lead:
1. Backend `erp-azhan` **tidak mengelola siklus hidup prospek/lead harian** (seperti tahapan negosiasi, follow-up WhatsApp, chat CS). Modul prospek tersebut dikelola oleh sistem CRM terpisah (`csumroh`).
2. `erp-azhan` hanya bertindak sebagai **Deal Conversion Gateway**: Ketika lead di CRM telah sepakat untuk mendaftar, sistem CRM memanggil endpoint `POST /api/admin/crm/deals` dengan menyertakan identifier lead eksternal: `crm_lead_id` (bertipe `CHAR(36)` / UUID).
3. Transaksi ini berjalan secara atomik:
   - Membuat/mencari data `jamaah`.
   - Membuat data `bookings` (mengurangi kuota kursi).
   - Mencatat data `payments` DP.
   - Menyimpan bukti transaksi di `crm_deal_requests` untuk mencegah satu lead dikonversi dua kali (`UNIQUE KEY (brand_id, crm_lead_id)`).

#### Pemetaan ke Kode Referral Agen:
Struktur payload request deal saat ini (`internal/crmdeal/model.go`):

```go
// Kutipan asli: internal/crmdeal/model.go (baris 12-25)
type DealRequest struct {
	BrandID           *int64      `json:"brand_id,omitempty"`
	CRMLeadID         string      `json:"crm_lead_id"`
	Jamaah            JamaahInput `json:"jamaah"`
	ScheduleID        int64       `json:"schedule_id"`
	RoomType          string      `json:"room_type"`
	Pax               int         `json:"pax"`
	CommitmentType    string      `json:"commitment_type"`
	SeatHoldExpiresAt *string     `json:"seat_hold_expires_at,omitempty"`
	PaymentAmount     *float64    `json:"payment_amount,omitempty"`
	PaymentMethod     *string     `json:"payment_method,omitempty"`
	PaymentDate       *string     `json:"payment_date,omitempty"`
	PaymentProofURL   *string     `json:"payment_proof_url,omitempty"`
}
```

**Temuan**: Pada `DealRequest` maupun tabel `crm_deal_requests`, **sama sekali belum ada field sumber lead (`lead_source`), `referral_code`, maupun `agent_id`**.

---

## BAGIAN 4 — POLA DASHBOARD REACT

### 4.1 Struktur Folder `frontend/` (NPM Workspace Monorepo)

Monorepo frontend diatur melalui `frontend/package.json`:

```text
frontend/
├── package.json                  # Root monorepo (workspaces: ["shared", "master-dashboard", "travel-dashboard"])
├── shared/                       # Library komponen & halaman bersama
│   ├── package.json              # name: "shared", main: "src/index.js"
│   └── src/
│       ├── api/client.js         # Axios instance bersama (baseURL: VITE_API_BASE_URL)
│       ├── components/           # UI komponen reusable (Card, Button, Badge, Modal, Form, dll)
│       └── pages/                # Halaman fungsional bersama:
│           ├── JamaahPage.jsx
│           ├── JamaahDetailPage.jsx
│           ├── JamaahFormPage.jsx
│           ├── BookingsPage.jsx
│           ├── BookingDetailPage.jsx
│           └── BookingFormPage.jsx
├── master-dashboard/             # Aplikasi Vite khusus Super Admin Grup (port 5173)
│   ├── package.json              # dependencies: { "shared": "*" }
│   └── src/
│       ├── App.jsx               # Routing Master Dashboard
│       ├── context/AuthContext.jsx # Auth state Super Admin (tolak akun jika brand_id != null)
│       ├── pages/                # Halaman khusus grup: Hotels, Airlines, Categories, Brands, Compliance, Komisi
│       └── components/Sidebar.jsx# Sidebar navigasi Master Dashboard
└── travel-dashboard/             # Aplikasi Vite khusus Admin Travel/Brand
    ├── package.json              # dependencies: { "shared": "*" }
    └── src/
        ├── App.jsx               # Routing Travel Dashboard
        ├── context/AuthContext.jsx # Auth state Brand Admin & CS (ekstrak brand_id dari token)
        └── pages/                # Halaman operasional brand: PaketPage, StokPerlengkapanPage, dll
```

#### Pola Penggunaan Paket `shared`:
Halaman operasional inti (Jamaah dan Booking) ditulis **satu kali** di dalam paket `shared`, lalu diimpor oleh kedua dashboard dengan prop konfigurasi `showBrandColumn`:
- Di `master-dashboard/src/App.jsx`: `<JamaahPage showBrandColumn={true} />` (menampilkan kolom nama brand karena mengelola seluruh brand).
- Di `travel-dashboard/src/App.jsx`: `<JamaahPage showBrandColumn={false} />` (kolom brand disembunyikan karena sudah berada di dalam scope brand miliknya).

---

### 4.2 Pola Routing & Permission Role-Based di React

1. **Routing**: Menggunakan `react-router-dom` v7 dengan komponen pembungkus `<ProtectedRoute />` dan `<DashboardLayout />`.
2. **Autentikasi & Guard**:
   - `master-dashboard`: Memeriksa keberadaan token `erp_access_token` di `localStorage`. Pada saat login, `AuthContext.jsx` memverifikasi token payload:
     ```javascript
     const payload = decodeJwtPayload(access_token);
     if (payload && payload.brand_id !== null) {
       throw new Error("Master Dashboard khusus untuk Super Admin Grup. Akun ini terikat ke brand tertentu...");
     }
     ```
   - `travel-dashboard`: Menggunakan `jwt-decode` untuk mengekstrak token ke dalam object `user`:
     ```javascript
     {
       id: decoded.sub,
       brand_id: decoded.brand_id,
       role: decoded.role,
       email: decoded.email
     }
     ```
   - Pembatasan Hak Akses (*Permission Guard*): Role checking dilakukan di level rendering komponen (misalnya akun dengan role `cs` disembunyikan dari menu inventori atau pengaturan brand, dan backend memvalidasi ulang via middleware `RequireAdminRole`).

---

## BAGIAN 5 — LIBRARY & TOOLING

### 5.1 Backend Dependencies (`C:\laragon\www\erp-azhan\go.mod`)

```text
module erp-azhan/api

go 1.25.0

require (
	github.com/go-chi/chi/v5 v5.0.12        // HTTP Router & Routing Middleware
	github.com/go-chi/cors v1.2.2           // Middleware Cross-Origin Resource Sharing
	github.com/go-sql-driver/mysql v1.8.1   // MySQL Database Driver
	github.com/golang-jwt/jwt/v5 v5.3.1     // Generator & Validator JSON Web Token (JWT)
	github.com/google/uuid v1.6.0           // Generator UUID v4 (jti, idempotency_key, seat_hold_key)
	github.com/joho/godotenv v1.5.1         // Loader konfigurasi environment (.env)
	golang.org/x/crypto v0.55.0             // Library Bcrypt untuk hashing password
)
```

### 5.2 Frontend Dependencies (`frontend/*/package.json`)

- **Routing**: `react-router-dom: ^7.18.2`
- **HTTP Client**: `axios: ^1.19.0`
- **JWT Helper**: `jwt-decode: ^4.0.0` (pada `travel-dashboard`)
- **Icon Set**: `lucide-react: ^1.31.0`
- **Build Tooling & Styling**: `vite: ^8.2.0`, `tailwindcss: ^3.4.19`, `postcss: ^8.5.26`, `autoprefixer: ^10.5.4`
- **State Management**: **TIDAK MENGGUNAKAN LIBRARY EKSTERNAL** (tidak ada Redux, Zustand, Recoil, TanStack Query). State autentikasi dan tenant dikelola murni menggunakan native **React Context API** (`AuthContext`) dan local component state (`useState`, `useEffect`).

---

## GAP & PERTIMBANGAN (Belum Ada di Kode)

Daftar aspek teknis dan bisnis yang belum ada di codebase dan perlu diputuskan sebelum tahap implementasi:

### 1. Entitas & Pemodelan Akun Agen Umroh
- Apakah Agen Umroh akan dimasukkan ke dalam tabel `admin_users` dengan memperluas `ENUM('admin', 'cs', 'agen')`, ataukah dibuatkan tabel khusus mandiri (misal tabel `agents` / `agen`)?
- Mengingat `admin_users` memiliki constraint `UNIQUE KEY email (email)` global, bagaimana skema pendaftaran jika satu individu ingin menjadi agen di dua brand berbeda menggunakan email/nomor WhatsApp yang sama?
- Jika memakai tabel terpisah (`agen`), apakah kredensial login menggunakan email + password (seperti admin), atau nomor WhatsApp + PIN 6-digit (seperti pada portal jamaah)?

### 2. Struktur Upline & Pembatasan 1-Tier
- Bagaimana hierarki upline direpresentasikan di database (misalnya kolom `upline_agent_id` yang me-referensi ke tabel agen itu sendiri)?
- Apakah constraint *1-tier ke atas* ditegakkan di level query/transaksi (mencegah komisi mengalir ke level ke-2 dan seterusnya)?
- Bagaimana mekanisme penentuan upline saat pendaftaran: apakah via tautan referral pendaftaran agen khusus (misal `daftar-agen?ref=KODEAGEN`) atau di-assign manual oleh admin brand?

### 3. Hak Milik Jamaah (Customer Ownership Permanen)
- Aturan bisnis menyatakan: *Kepemilikan atas seorang jamaah bersifat permanen ke perekrut pertamanya.*
- Di tabel `jamaah`, saat ini belum ada kolom yang mencatat perekrut. Apakah perlu ditambahkan kolom `first_agent_id` atau `referral_agent_id` di tabel `jamaah` yang dikunci permanen (*immutable*) setelah diisi?
- Bagaimana validasi sistem jika jamaah yang bersangkutan kelak mendaftar menjadi agen: apakah record jamaahnya tetap terikat komisi repeat order ke agen pertamanya?

### 4. Skema Transaksi Komisi & Perhitungan
- Belum ada tabel transaksi komisi. Parameter apa saja yang perlu dicatat di tabel komisi (misal: `booking_id`, `agent_id`, `beneficiary_type` ['agen_langsung', 'upline', 'cashback_jamaah'], `tipe_komisi` ['direct', 'bonus_upline', 'repeat_order'], `nominal`, `status` ['pending', 'verified', 'paid'])?
- Pada titik siklus status booking mana hak komisi dinyatakan aktif / *earned* (apakah saat booking berstatus `dp`, `lunas`, atau verifikasi manual keuangan)?
- Bagaimana pembagian nominal komisi: di mana konfigurasi flat rate komisi per paket atau per pax disimpan (apakah di tabel `brands`, tabel `schedules`, atau tabel pengaturan komisi khusus)?

### 5. Penangkapan Referral pada Alur Booking (Microsite & CRM)
- Di tabel `bookings`, saat ini tidak ada kolom untuk menyimpan kode referral/agen.
- Bagaimana kode referral ditangkap dari calon jamaah:
  - Pada pemesanan mandiri via microsite: apakah melalui URL parameter `?ref=...`, field input manual di form booking, atau keduanya?
  - Pada transaksi deal via CRM (`POST /api/admin/crm/deals`): bagaimana CS menyertakan referral agen dari lead yang bersangkutan?

### 6. Arsitektur Dashboard / Antarmuka Agen
- Untuk staf internal (Admin Brand & Super Admin): Di mana modul pengelolaan daftar agen dan persetujuan pencairan komisi akan ditempatkan (`travel-dashboard` untuk operasional brand, dan `master-dashboard` pada menu `/komisi` yang sudah ada)?
- Untuk agen eksternal: Di mana Portal Agen self-service akan di-hosting? Apakah menjadi modul baru di dalam microsite publik Next.js (mirip `/portal` jamaah), ataukah aplikasi dashboard terpisah di monorepo `frontend/`?

---

## Lanjutan: Struktur Multi-Pax & Manifest

Investigasi tambahan ini melengkapi laporan audit sebelumnya dengan pembuktian kode dan skema terkait pencatatan data individual jamaah dalam satu pemesanan multi-pax (`seat_count > 1`), tata kelola dokumen/manifest, serta titik picu transisi status booking ke `lunas`.

---

### 1. Struktur Multi-Pax: Tabel Penghubung `booking_pax`

Sistem **TIDAK** memecah booking multi-pax menjadi beberapa baris `bookings` terpisah. Sistem menggunakan arsitektur **Header-Detail**:
- **Header**: Tabel `bookings` (menyimpan kode booking, jadwal paket, PIC penanggung jawab, total harga, status, dan jumlah kursi).
- **Detail (Manifest)**: Tabel **`booking_pax`** (menghubungkan 1 baris `bookings` ke banyak baris `jamaah`).

Tabel ini dibuat melalui migrasi `migrations/040_booking_multi_pax.sql` dan diperketat dengan constraint unik pada `migrations/046_unique_booking_jamaah.sql`.

#### Kutipan Skema Persis: `booking_pax`
*(Sumber: `SHOW CREATE TABLE booking_pax` pada database `erp_azhan_dev`)*

```sql
CREATE TABLE `booking_pax` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `booking_id` bigint unsigned NOT NULL,
  `jamaah_id` bigint unsigned NOT NULL,
  `pax_type` enum('reguler','infant') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'reguler',
  `room_type` enum('Quad','Triple','Double') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `harga_pax` decimal(12,0) NOT NULL DEFAULT '0',
  `counts_for_seat` tinyint(1) NOT NULL DEFAULT '1',
  `pax_status` enum('aktif','batal') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aktif',
  `progress_visa` tinyint(1) NOT NULL DEFAULT '0',
  `progress_siskopatuh` tinyint(1) NOT NULL DEFAULT '0',
  `progress_manasik` tinyint(1) NOT NULL DEFAULT '0',
  `progress_vaksin_meningitis` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `perlengkapan_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'belum_diberikan' COMMENT 'belum_diberikan, sudah_diberikan',
  `perlengkapan_tanggal` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_booking_jamaah` (`booking_id`,`jamaah_id`),
  KEY `jamaah_id` (`jamaah_id`),
  CONSTRAINT `booking_pax_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `booking_pax_ibfk_2` FOREIGN KEY (`jamaah_id`) REFERENCES `jamaah` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=204 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Cara Sistem Mengelola Data Rombongan / Multi-Pax:
1. **Aturan 1 Baris per Pax**: Setiap orang dalam satu pesanan (baik jamaah penanggung jawab/PIC maupun anggota rombongan keluarga tambahan) wajib memiliki record individual tersendiri di tabel `jamaah`.
2. **Relasi ke Booking**: Semua jamaah dalam rombongan tersebut dimasukkan ke dalam tabel `booking_pax` dengan `booking_id` yang sama. Pasangan `(booking_id, jamaah_id)` dijamin unik oleh constraint `uq_booking_jamaah`.
3. **Pembeda PIC vs Anggota**:
   - Kolom `bookings.pic_jamaah_id` merujuk ke ID salah satu jamaah yang bertindak sebagai kontak utama pendaftaran.
   - PIC tersebut **tetap dicatat sebagai 1 baris** di `booking_pax` (sehingga jika `seat_count = 2`, tabel `booking_pax` berisi tepat 2 baris: 1 baris PIC + 1 baris anggota rombongan).

#### Bukti Kode Pembuatan Multi-Pax:
Pada alur self-booking publik (`internal/selfbooking/repository.go` baris 260-282):

```go
// Kutipan asli: internal/selfbooking/repository.go
// 1. Insert PIC ke booking_pax
_, err = tx.ExecContext(ctx, `
	INSERT INTO booking_pax (booking_id, jamaah_id, pax_type, room_type, harga_pax, counts_for_seat, pax_status)
	VALUES (?, ?, 'reguler', ?, ?, TRUE, 'aktif')
`, bookingID, picJamaahID, req.PIC.RoomType, picHarga)

// 2. Loop insert seluruh anggota rombongan ke booking_pax
for i, a := range req.Anggota {
	// ... (penentuan harga_pax dan room_type) ...
	_, err = tx.ExecContext(ctx, `
		INSERT INTO booking_pax (booking_id, jamaah_id, pax_type, room_type, harga_pax, counts_for_seat, pax_status)
		VALUES (?, ?, ?, ?, ?, ?, 'aktif')
	`, bookingID, anggotaJamaahIDs[i], a.PaxType, rType, hrg, countsForSeat)
}
```

---

### 2. Modul & Implementasi "Manifest Jamaah"

Pencatatan data manifest (identitas peserta, paspor, dan progres administratif) diatur secara modular antara **relasi manifest per booking** dan **arsip dokumen fisik per jamaah**:

#### A. Data Progres Manifest per Jamaah dalam Booking (`internal/booking`)
- Seluruh daftar pax untuk sebuah booking diambil melalui method `ListPaxByBookingID` (`internal/booking/repository.go` baris 233-272).
- Progres operasional individu (`progress_visa`, `progress_siskopatuh`, `progress_manasik`, `progress_vaksin_meningitis`, dan `perlengkapan_status`) tersimpan langsung sebagai kolom di tabel `booking_pax`.
- Method `GetByID` pada booking repository secara otomatis memanggil `ListPaxByBookingID` sehingga entitas `Booking` selalu menyertakan slice `Pax []BookingPax`.

#### B. Pengelolaan Paspor & Berkas Fisik (`internal/dokumen` & `dokumen_jamaah`)
- Berkas paspor dan dokumen legalitas tidak disimpan di level `bookings` maupun `booking_pax`, melainkan di tabel **`dokumen_jamaah`** yang terikat langsung ke individu (`jamaah_id`):

```sql
-- Kutipan skema: SHOW CREATE TABLE dokumen_jamaah
CREATE TABLE `dokumen_jamaah` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `jamaah_id` bigint unsigned NOT NULL,
  `jenis` enum('pas_foto','paspor','ktp','kk','buku_nikah','akte_lahir','vaksin_meningitis') NOT NULL,
  `file_url` varchar(500) DEFAULT NULL,
  `status` enum('belum_upload','submitted','approved','rejected') NOT NULL DEFAULT 'belum_upload',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_jamaah_jenis` (`jamaah_id`,`jenis`),
  CONSTRAINT `dokumen_jamaah_ibfk_1` FOREIGN KEY (`jamaah_id`) REFERENCES `jamaah` (`id`)
) ENGINE=InnoDB;
```

- Status paspor pada manifest dihitung secara dinamis melalui fungsi `checkPasporUploaded` di `internal/booking/repository.go`:

```go
// Kutipan asli: internal/booking/repository.go (baris 278-287)
func (r *Repository) checkPasporUploaded(ctx context.Context, jamaahID int64) (bool, error) {
	var count int
	err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) 
		FROM dokumen_jamaah 
		WHERE jamaah_id = ? AND jenis = 'paspor' AND file_url IS NOT NULL AND file_url != ''
	`, jamaahID).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("booking.checkPasporUploaded: %w", err)
	}
	return count > 0, nil
}
```

#### C. Representasi di Antarmuka Frontend
- **Form Input Booking**: `frontend/shared/src/pages/BookingFormPage.jsx` (baris 1541) memiliki komponen MetaBox berlabel `"Daftar Jamaah (Manifest)"` tempat staf menginput/memilih jamaah rombongan, menentukan tipe kamar masing-masing pax, serta menandai PIC.
- **Detail Booking**: `frontend/shared/src/pages/BookingDetailPage.jsx` menampilkan tabel manifest lengkap dengan status checklist per jamaah: Paspor (dari modul dokumen), Vaksin Meningitis, Visa, Siskopatuh, Manasik, dan Log Penyerahan Perlengkapan.

---

### 3. Titik Perubahan Status Booking (`status = 'lunas'`)

#### A. Mekanisme Transisi Status Finansial
Di backend Go `erp-azhan`, **admin dilarang mengubah status booking menjadi `dp` atau `lunas` secara manual**. Handler `internal/booking/handler.go` secara tegas menolak request perubahan status manual tersebut:

```go
// Kutipan asli: internal/booking/handler.go (baris 526-528)
// Status finansial (dp, lunas, baru) hanya dapat ditentukan melalui pencatatan pembayaran via syncBookingStatusTx
if req.Status != "batal" {
	writeError(w, http.StatusBadRequest, "Status DP dan Lunas hanya dapat ditentukan melalui pencatatan pembayaran, tidak bisa diubah manual.")
	return
}
```

Transisi status menuju `lunas` dikendalikan secara otomatis dan terpusat melalui fungsi:
👉 **`syncBookingStatusTx`** pada `internal/payment/repository.go` (baris 302-424).

Fungsi ini dieksekusi di dalam transaksi database (`tx`) pada dua momen:
1. Saat admin/keuangan menyetujui pembayaran transfer dari status `pending` ke `confirmed` via method `UpdateStatus` (`internal/payment/repository.go:291`).
2. Saat pembayaran baru langsung tercatat berstatus `confirmed` (misalnya setoran kas/tunai) via method `Create` (`internal/payment/repository.go:231`).

#### B. Kutipan Kode Titik Pelunasan (`syncBookingStatusTx`)
```go
// Kutipan asli: internal/payment/repository.go (baris 360-424)
	targetStatus := currentStatus
	targetHarga := 0.0
	if totalHarga.Valid {
		targetHarga = totalHarga.Float64
	}

	if targetHarga > 0 && totalPaid >= targetHarga {
		targetStatus = "lunas"
	} else if requiredDP > 0 {
		if totalPaid >= requiredDP {
			if currentStatus == "baru" || currentStatus == "lunas" {
				targetStatus = "dp"
			}
		}
		// ...
	}

	if targetStatus != currentStatus {
		// ... (penyesuaian seat_sisa jika dari baru ke dp/lunas) ...
		_, err = tx.ExecContext(ctx,
			`UPDATE bookings SET status=?,is_seat_blocked=IF(? IN ('dp','lunas'),TRUE,is_seat_blocked),
			 seat_hold_expires_at=IF(? IN ('dp','lunas'),NULL,seat_hold_expires_at),
			 seat_hold_key=IF(? IN ('dp','lunas'),NULL,seat_hold_key) WHERE id=?`,
			targetStatus, targetStatus, targetStatus, targetStatus, bookingID)
		if err != nil {
			return err
		}
	}
```

*(Catatan: Titik sekunder transisi lunas juga terdapat pada `recalculateTotalTx` di `internal/booking/repository.go:1450`, yang terpanggil jika admin mengurangi add-on atau menambah diskon sehingga akumulasi pembayaran terkonfirmasi yang sudah ada menjadi cukup melunasi sisa tagihan baru).*

#### C. Akses ke Data Jamaah di Titik Pelunasan
- **Kondisi Saat Ini**: Di dalam `syncBookingStatusTx`, sistem baru melakukan agregasi jumlah pax aktif:
  ```go
  _ = tx.QueryRowContext(ctx, `
      SELECT COUNT(*) FROM booking_pax
      WHERE booking_id=? AND counts_for_seat=TRUE AND pax_status='aktif'`, bookingID,
  ).Scan(&activeRegularPax)
  ```
  Fungsi tersebut belum meload objek data jamaah individual (`jamaah_id`, nama, dll) ke dalam memori aplikasi.
- **Tingkat Kemudahan Akses**: **Sangat Mudah**. Karena `syncBookingStatusTx` sudah berada di dalam transaksi SQL aktif (`tx *sql.Tx`) dan memegang parameter `bookingID`, seluruh data jamaah dalam booking tersebut dapat diakses secara instan melalui query:
  ```sql
  SELECT bp.id, bp.jamaah_id, bp.pax_type, bp.harga_pax, bp.pax_status
  FROM booking_pax bp
  WHERE bp.booking_id = ? AND bp.pax_status = 'aktif'
  ```
  atau dengan memanggil helper internal `ListPaxByBookingID(ctx, bookingID)`.

---

### 4. Simpulan Gap: Implementasi Aturan "Booking Multi-Pax Otomatis Satu Agen"

Berdasarkan pembuktian kode dan skema di atas, berikut kesimpulan terhadap implementasi aturan bisnis komisi agen:

1. **Kesiapan Struktur Relasi (SUDAH SIAP SECARA ARSITEKTUR)**:
   - Pola relasi **Header-Detail (`bookings` -> `booking_pax`)** yang ada di codebase saat ini **sudah siap dan sangat ideal**. 
   - Karena seluruh jamaah (baik PIC maupun anggota rombongan keluarga) bernaung di bawah satu `booking_id` yang sama, prinsip *"booking multi-pax otomatis satu agen"* secara alami terpenuhi: cukup dengan menautkan booking tersebut ke satu agen, seluruh pax di tabel `booking_pax` otomatis terasosiasi dengan agen yang bersangkutan tanpa perlu memecah transaksi booking menjadi record terpisah.

2. **Gap Data yang Masih Ada (MEMERLUKAN MIGRATION / TABEL BARU)**:
   - **Gap 1 (Asosiasi Agen pada Booking)**: Di tabel `bookings` saat ini **belum ada kolom foreign key** untuk agen (misalnya `agent_id` atau `referral_code`).
   - **Gap 2 (Customer Ownership Jamaah di Tabel `jamaah`)**: Di tabel `jamaah` saat ini **belum ada kolom penanda perekrut pertama** (misalnya `first_agent_id`). Dalam booking multi-pax (misal 1 PIC membawa 3 anggota keluarga), belum ada mekanisme skema untuk menentukan apakah seluruh anggota rombongan baru otomatis dikunci kepemilikannya ke agen pemegang booking, ataukah perlu dicek perorangan jika ada salah satu anggota yang sebelumnya sudah pernah terdaftar lewat agen berbeda.
   - **Gap 3 (Tabel Transaksi Komisi)**: Saat `syncBookingStatusTx` menetapkan booking menjadi `lunas`, belum ada tabel komisi (misalnya `agent_commissions`) untuk menampung hak komisi per pax (misal: 1 booking berisi 4 pax = 4 x nominal komisi flat) beserta alokasi bonus pembinaan upline dan komisi repeat order.


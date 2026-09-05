# DalAy - Daily Ayah & Smart Personal Finance

<div align="center">

![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-SDK_57-000020?style=for-the-badge&logo=expo&logoColor=white)
![Database](https://img.shields.io/badge/Database-Expo_SQLite_(WAL)-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Android](https://img.shields.io/badge/Platform-Android_%7C_iOS_%7C_Tablet-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![Design](https://img.shields.io/badge/UI_Design-Neo--Brutalism-F59E0B?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**Aplikasi Mobile Produktivitas Muslim & Manajemen Keuangan Pribadi Berbasis AI dengan Desain Neo-Brutalism yang Cepat, Modern, dan Responsif.**

[Fitur Utama](#-fitur-utama) • [Tech Stack](#-tech-stack) • [Panduan Setup Developer](#-panduan-setup-developer-baru) • [Arsitektur & Konsep Inti](#-arsitektur--konsep-pengembangan) • [Build APK Release](#-cara-build-apk-release-hemat-ukuran--18-mb) • [Troubleshooting](#-troubleshooting-developer)

</div>

---

## 🌟 Fitur Utama

### 1. 📖 Al-Quran, Tafsir & Spiritual (100% Offline)
- **114 Surah Lengkap (6.236 Ayat):** Teks Arab Rasm Utsmani, transliterasi Latin, dan terjemahan resmi Kemenag RI & English.
- **Tafsir Ringkas / Wajiz Kemenag RI:** Penjelasan ayat resmi langsung dari Kemenag tanpa kuota internet.
- **Modular Lazy Loading:** Pemuatan data per surah secara on-demand (~150 KB/surah) menjaga penggunaan RAM tetap minimal dan bebas lag.
- **Audio Streaming Murottal:** Pemutar tilawah ayat per ayat Syekh Misyari Rasyid Al-Afasi.
- **Koleksi Hadits Shahih Tematik:** Inspirasi ibadah harian dari berbagai perawi terpercaya lengkap dengan opsi ganti perawi dan bagikan.
- **Bookmark & Riwayat Bacaan:** Penyimpanan ayat favorit dan pencatatan riwayat bacaan otomatis via SQLite.

### 2. 💳 Keuangan Cerdas & Voice AI Input
- **Local Relational Database (Expo SQLite):** Performa tinggi dengan mode WAL (*Write-Ahead Logging*), pencarian cepat, dan Optimistic UI (0ms delay).
- **Voice Transaction (Push-to-Talk AI):** Pencatatan transaksi berbasis suara natural. Mendeteksi nominal, nama transaksi, serta klasifikasi otomatis *Pengeluaran* vs *Pemasukan* (*"pengeluaran makan siang 20 ribu"*, *"keluar 50rb bensin"*, *"gaji masuk 5 juta"*).
- **AI Scan Struk Belanja (OCR & Gemini AI):** Pindai nota/struk belanja dari kamera atau galeri, otomatis mengekstrak merchant, tanggal, total, kategori, hingga rincian belanja satuan (*itemized breakdown*).
- **Smart Quick Input Bar:** Input transaksi cepat berbasis teks bebas (contoh: *"kopi 25rb bca"*).
- **Multi-Wallet & Rekening:** Manajemen saldo tunai, bank, dan e-wallet dengan penyesuaian saldo (*balance audit reconciliation*).
- **Transfer Antar Dompet:** Simulasi live saldo pengirim dan penerima dengan opsi biaya admin transaksi.
- **Impor & Ekspor Excel (`.xlsx`):** Cetak laporan keuangan ke spreadsheet Excel atau impor transaksi massal.
- **Grafik Interaktif & Statistik:** Visualisasi Donut Chart per kategori dan rangkuman kekayaan bersih (*net worth*).

### 3. 🎨 Desain, Tema & Pengalaman Pengguna (UX)
- **Neo-Brutalism Style:** Estetika tegas dengan kontras berkarakter (*bold borders*), bayangan keras (*hard shadows*), dan tipografi modern.
- **6 Palet Tema Eksklusif:** Modern Teal, Emerald Oasis, Sunset Gold, Ocean Royal, Rose Blossom, dan Dark Luxe (OLED Black).
- **Floating Screen Toast:** Sistem notifikasi mengambang di atas layar independen dari posisi scroll.
- **Dukungan Tablet Adaptif:** Layout lanskap dual-pane otomatis saat dijalankan di perangkat tablet (layar >= 600dp).
- **Gesture Swipe Navigation:** Perpindahan mulus antar tab utama (Quran, Keuangan, Pengaturan).
- **Bilingual:** Pilihan bahasa Indonesia dan English di seluruh antarmuka.

---

## 🛠️ Tech Stack

| Komponen | Teknologi & Versi |
|---|---|
| **Framework** | [React Native](https://reactnative.dev/) `0.86.3` + [Expo](https://expo.dev/) SDK `~57.0.18` |
| **Language** | JavaScript (ESNext) |
| **Database Utama** | [`expo-sqlite`](https://docs.expo.dev/versions/latest/sdk/sqlite/) (`dalay.db` SQLite v3, WAL mode) |
| **Penyimpanan Sekunder** | `@react-native-async-storage/async-storage` (Pengaturan UI, Sesi Akun) |
| **Voice Recognition** | `expo-speech-recognition` |
| **AI / OCR Engine** | Google Gemini Vision & Text API (`@google/genai` / REST) |
| **Cloud Sync** | Google Drive REST API v3 via `expo-auth-session` |
| **Audio Engine** | `expo-audio` |
| **Spreadsheet** | `xlsx` + `expo-sharing` & `expo-document-picker` |
| **Ikon & Tipografi** | `@expo/vector-icons` (Ionicons, MaterialCommunityIcons) |

---

## 🚀 Panduan Setup Developer Baru

Ikuti langkah-langkah berikut untuk menjalankan proyek di komputer developer baru.

### 1. Prasyarat Sistem
- **Node.js:** Versi **18 LTS** atau **20 LTS** (disarankan `Node.js >= 18.18.0`).
- **npm:** Versi `npm >= 9.0.0`.
- **Git**
- **Aplikasi Expo Go:** Unduh di smartphone Android/iOS Anda melalui Google Play Store / App Store.

---

### 2. Clone & Install Dependencies

```bash
# Clone repository
git clone https://github.com/haikal-266/MY-APPS.git

# Masuk ke direktori proyek
cd "MY APPS"

# Install seluruh dependency
npm install
```

> **Catatan:** Jangan gunakan flag `--legacy-peer-deps` kecuali diperlukan. Dependency telah diselaraskan untuk Expo SDK 57 dan React 19.

---

### 3. Menjalankan Aplikasi di Mode Development

Pilih perintah yang sesuai dengan kondisi jaringan Anda:

#### Opsi A: Mode Tunnel (Sangat Disarankan ⭐)
Gunakan mode ini jika smartphone dan komputer Anda **berbeda jaringan Wi-Fi, menggunakan paket data / hotspot HP**, atau jika QR Code gagal di-scan:
```bash
npm run start:tunnel
```
*Perintah ini menggunakan `@expo/ngrok` untuk membuat terowongan cloud publik sehingga Expo Go selalu dapat terhubung tanpa kendala firewall.*

#### Opsi B: Mode Standard (Wi-Fi Lokal Sama)
Jika komputer dan smartphone berada dalam satu jaringan Wi-Fi lokal yang sama:
```bash
npm start
```

#### Opsi C: Reset & Clear Cache Bundler
Jika Anda mengalami error cache bundler lama atau perubahan kode tidak terdeteksi:
```bash
npm run start:clear
```

---

### 4. Membuka di Perangkat
1. **Smartphone Fisik (Expo Go):** Buka aplikasi **Expo Go** di HP, pilih menu **Scan QR Code**, lalu arahkan kamera ke QR code yang tampil di terminal.
2. **Android Emulator:** Tekan tombol `a` pada terminal saat Metro Bundler aktif.
3. **Menu Pengembang (Developer Menu):** Goyangkan HP (*shake device*) atau tekan `m` di terminal untuk membuka menu reload / inspect.

---

## 🧠 Arsitektur & Konsep Pengembangan

Poin penting yang wajib dipahami oleh developer saat memodifikasi kode:

### A. Pola Database & Storage (`src/services/database.js`)
- Data transaksi, dompet, kategori kustom, dan favorit/riwayat Al-Quran disimpan di **SQLite (`dalay.db`)**, bukan lagi di AsyncStorage.
- **Optimistic UI:** Saat pengguna menambah/mengubah data, React State di-*update* secara instan (**0ms latency**), sementara query SQLite dijalankan secara asynchronous di latar belakang.
- **Auto-Migration:** Aplikasi menyertakan migrasi otomatis satu kali dari AsyncStorage ke SQLite.
- **Schema Migrations:** Versi database dikontrol oleh `SCHEMA_VERSION` di `src/services/database.js`. Jika ingin menambah tabel/kolom baru, naikkan `SCHEMA_VERSION` dan tambahkan DDL di fungsi `runSchemaMigration()`.

### B. Input Transaksi Suara (`src/hooks/useVoiceInput.js` & `src/services/voiceService.js`)
- Menggunakan `expo-speech-recognition` lokal.
- Parser otomatis memisahkan teks input suara ke nominal dan nama transaksi.
- Mendeteksi jenis transaksi:
  - **Pemasukan:** mengandung kata *"pemasukan"*, *"masuk"*, *"gaji"*, *"terima"*, *"income"*, dsb.
  - **Pengeluaran:** default, atau mengandung kata *"pengeluaran"*, *"keluar"*, *"beli"*, *"bayar"*, dsb.

### C. Sistem Tema Dinamis (`src/theme/themes.js` & `src/stores/themeStore.js`)
- Seluruh komponen UI dilarang menggunakan *hardcoded colors*. Selalu gunakan objek `colors` dari hook `useTheme()`:
  ```javascript
  import { useTheme } from '../stores/themeStore';
  const { colors, isDark } = useTheme();
  ```
- Tersedia 6 preset warna yang telah dikurasi: `teal`, `emerald`, `amber`, `royal_blue`, `rose`, dan `dark_luxe`.

### D. Sistem Toast Universal (`floatingScreenToast`)
- Semua layar utama (`QuranScreen`, `FinanceScreen`, `SettingsScreen`) menggunakan pola notifikasi melayang di bagian atas layar (`styles.floatingScreenToast`) dengan `pointerEvents="none"` dan `zIndex: 9999`.

---

## 📦 Cara Build APK Release (Hemat Ukuran ~18 MB)

Proyek ini telah dikonfigurasi dengan optimasi **R8 Code Minification**, **Resource Shrinking**, dan **ABI Splits**, menghasilkan file APK siap pakai berukuran **15 – 19 MB** (bukan 70+ MB *fat bundle*).

### Langkah Build Standalone APK:

1. Masuk ke direktori `android/`:
   ```bash
   cd android
   ```

2. Jalankan perintah kompilasi Gradle:
   - **Windows (PowerShell / CMD):**
     ```powershell
     .\gradlew assembleRelease
     ```
   - **Linux / macOS:**
     ```bash
     ./gradlew assembleRelease
     ```

3. File APK output berada di:
   ```
   android/app/build/outputs/apk/release/
   ```
   - **`app-arm64-v8a-release.apk`** (**~18 MB**): Disarankan untuk 99% smartphone Android modern saat ini.
   - **`app-armeabi-v7a-release.apk`**: Untuk perangkat Android 32-bit legacy.
   - **`app-universal-release.apk`**: Paket gabungan universal untuk semua jenis chipset.

---

## 📁 Struktur Folder

```text
├── android/                    # Konfigurasi native Android (Gradle, Proguard, ABI splits)
├── assets/                     # Ikon aplikasi, splash screen, dan aset visual
├── scripts/                    # Skrip generator & parser dataset Al-Quran Kemenag RI
├── src/
│   ├── components/             # Komponen UI modular
│   │   ├── common/             # Komponen umum (CategoryIcon, CategoryPickerModal, dll)
│   │   ├── finance/            # Modul keuangan (WalletCarousel, TransactionList, QuickInput, dll)
│   │   ├── neo/                # Komponen dasar Neo-Brutalism (NeoCard, NeoButton, NeoModal, NeoInput)
│   │   ├── quran/              # Modul Al-Quran (AyatCard, TafsirModal, RandomHadithCard, ReminderModal)
│   │   ├── settings/           # Komponen pengaturan (GeminiAiCard, dll)
│   │   ├── sync/               # Komponen Google Drive Sync (GoogleSyncCard)
│   │   └── voice/              # Komponen voice input (PushToTalkButton, VoiceListeningOverlay)
│   ├── data/
│   │   └── quran/
│   │       ├── surahs/         # 114 File JSON Surah Offline (Arab, Latin, Terjemahan, Tafsir Wajiz)
│   │       └── offlineQuran.js # Modular on-demand lazy loader
│   ├── hooks/                  # Custom React Hooks (useVoiceInput, useReceiptScanner, dll)
│   ├── i18n/                   # Lokalisasi bahasa (translations.js: ID & EN)
│   ├── navigation/             # BottomTabBar kustom & TabletRightNavRail
│   ├── screens/                # Layar utama (QuranScreen, FinanceScreen, SettingsScreen)
│   ├── services/               # Layanan eksternal & basis data
│   │   ├── database.js         # Central SQLite layer, schema DDL, versioned migration & CRUD
│   │   ├── receiptScanner.js   # Gemini OCR & parser struk belanja
│   │   ├── excelExport.js      # Generator & import laporan spreadsheet Excel
│   │   ├── googleDriveSync.js  # Backup & Restore cloud Google Drive
│   │   └── notificationService.js # Jadwal pengingat harian
│   ├── stores/                 # React Context State (financeStore, walletStore, quranStore, themeStore, dll)
│   ├── theme/                  # Token tema (themes.js, typography.js, neoBrutalism.js)
│   └── utils/                  # Fungsi pembantu (formatters, textFormatter, surahData, categories)
├── App.js                      # Root component, database bootstrap, & provider tree
├── app.json                    # Konfigurasi Expo SDK 57 & Android build metadata
└── package.json                # Dependencies, NPM scripts & dev tooling
```

---

## 🔧 Troubleshooting Developer

### 1. HP Tidak Bisa Scan QR Code / "Network response timed out"
- **Solusi:** Jalankan menggunakan mode tunnel:
  ```bash
  npm run start:tunnel
  ```
  Pastikan paket data atau Wi-Fi smartphone memiliki akses internet aktif.

### 2. Error Cache Metro Bundler / Syntax Phantom
- **Solusi:** Bersihkan seluruh cache sementara:
  ```bash
  npm run start:clear
  ```

### 3. Masalah Database SQLite
- Seluruh inisialisasi tabel ditangani secara otomatis oleh `initializeDatabase()` di `App.js`.
- Jika Anda mengubah struktur kolom pada tabel yang sudah ada, naikkan nilai `SCHEMA_VERSION` di [src/services/database.js](file:///c:/Users/KallKun/Documents/Kuliah/MY%20APPS/src/services/database.js) dan definisikan statement `ALTER TABLE` pada fungsi migrasi.

### 4. API Key Google Gemini (Fitur AI Struk)
- Pengguna dapat memasukkan API Key Gemini pribadi secara gratis melalui menu **Pengaturan > Pengaturan Gemini AI**.
- Kunci disimpan dengan aman di local storage perangkat pengguna.

---

## 🤝 Kontribusi & Workflow Git

1. Fork atau buat branch baru dari `master`:
   ```bash
   git checkout -b feature/NamaFitur
   ```
2. Pastikan kode bebas dari error linting/sintaks:
   ```bash
   node -c src/services/database.js
   ```
3. Commit perubahan dengan pesan deskriptif:
   ```bash
   git commit -m "feat: Menambahkan integrasi fitur baru"
   ```
4. Buka Pull Request ke branch `master`.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah Lisensi **MIT**. Silakan gunakan, kembangkan, dan manfaatkan untuk kebaikan.

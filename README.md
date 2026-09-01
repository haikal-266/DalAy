# DalAy - Daily Ayah & Personal Finance

<div align="center">

![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-SDK_57-000020?style=for-the-badge&logo=expo&logoColor=white)
![Android](https://img.shields.io/badge/Android-APK-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![Design](https://img.shields.io/badge/UI_Design-Neo--Brutalism-F59E0B?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**Aplikasi Mobile Produktivitas Muslim & Manajemen Keuangan Pribadi Berbasis AI dengan Desain Neo-Brutalism yang Modern, Responsif, dan Cepat.**

[Fitur Utama](#-fitur-utama) • [Tech Stack](#-tech-stack) • [Instalasi Cepat](#-langkah-cepat-setup--menjalankan) • [Cara Build APK](#-cara-build-apk-release-hemat-ukuran--18-mb) • [Struktur Folder](#-struktur-folder)

</div>

---

## 🌟 Fitur Utama

### 1. 📖 Al-Quran & Spiritual (100% Offline)
- **Akses Offline Penuh:** 114 Surah (6.236 Ayat) lengkap dengan teks Arab (Rasm Utsmani), transliterasi Latin, dan terjemahan resmi Bahasa Indonesia & Inggris.
- **Tafsir Ringkas / Wajiz Kemenag RI:** Tafsir ringkas resmi dari Kementerian Agama RI dapat diakses instan tanpa membutuhkan kuota internet.
- **Modular Lazy Loading:** Setiap surah dimuat secara modular on-demand (~150 KB per surah), menjaga konsumsi RAM tetap sangat ringan dan bebas lag.
- **Pemutar Audio Murottal:** Streaming audio tilawah ayat per ayat dengan lantunan merdu Syekh Misyari Rasyid Al-Afasi.
- **Pengingat Harian (Notification Service):** Pengingat bacaan ayat harian terjadwal langsung ke sistem notifikasi Android/iOS.
- **Kumpulan Hadits Shahih:** Koleksi hadits pilihan tematik untuk inspirasi ibadah harian serta fitur penanda/bookmark ayat favorit.

### 2. 💳 Keuangan Pribadi & AI Receipt Scanner
- **AI Scan Struk Belanja (OCR & Gemini AI):** Pindai bukti nota/struk belanja fisik melalui kamera atau galeri foto. Sistem AI otomatis mengekstrak nama merchant, tanggal, total nominal, kategori, hingga rincian item belanja satuan (*itemized breakdown*).
- **Smart Quick Input Bar:** Deteksi otomatis pencatatan transaksi dari teks bebas (contoh: *"makan siang 25k, bensin 15rb ke bca"*).
- **Multi-Wallet & Rekening:** Kelola saldo tunai, rekening bank, e-wallet, atau dompet kustom dengan fitur penyesuaian saldo (*balance adjustment*) dan pencatatan riwayat audit.
- **Transfer Antar Dompet:** Pindahkan saldo antar rekening/dompet dengan simulasi live saldo dan opsi biaya admin transaksi.
- **Kategori Kustom & Icon Picker:** Buat kategori pengeluaran dan pemasukan sendiri dengan puluhan pilihan ikon vektor dan palet warna modern.
- **Rincian Struk & Edit Interaktif:** Validasi item struk belanja, zoom foto bukti nota, dan ubah kategori transaksi langsung dengan satu ketukan (*interactive category badge*).
- **Import & Export Excel (`.xlsx`):** Unduh pembukuan laporan keuangan ke spreadsheet Excel atau impor riwayat transaksi secara massal.
- **Visual Donut Chart & Statistik:** Grafik donat interaktif per kategori pengeluaran dan pemasukan dengan rincian persentase dan total kekayaan bersih.
- **Navigasi Tanggal 5-Hari (Date Strip):** Filter transaksi berdasarkan periode harian, mingguan, bulanan, atau rentang tanggal kustom.

### 3. ☁️ Cloud Sync & Google Drive Backup
- **Pencadangan Google Drive:** Backup dan restore seluruh data transaksi keuangan, dompet, dan preferensi aplikasi secara aman ke akun Google Drive pribadi pengguna.
- **Pengaturan API Key AI:** Opsi memasukkan Google Gemini API Key sendiri untuk pemindaian struk AI berkecepatan tinggi tanpa batasan.

### 4. 🎨 Tampilan & Pengalaman Pengguna (UX)
- **Neo-Brutalism Style:** Estetika berkarakter dengan batas kontras (*bold borders*), bayangan tegas (*hard shadows*), dan tipografi modern yang memanjakan mata.
- **Swipe Navigation:** Navigasi horizontal antar layar utama (Al-Quran, Keuangan, dan Pengaturan) secara halus melalui gestur swipe.
- **Dark Mode & Light Mode:** Tema visual konsisten untuk kenyamanan membaca di berbagai kondisi pencahayaan.
- **Dukungan Bilingual:** Bahasa Indonesia dan Bahasa Inggris secara menyeluruh.

---

## 🛠️ Tech Stack

| Komponen | Teknologi |
|---|---|
| **Framework** | [React Native](https://reactnative.dev/) (v0.86) + [Expo](https://expo.dev/) (SDK 57) |
| **Language** | JavaScript (ESNext) |
| **UI Design** | Neo-Brutalism Vanilla Styling + [react-native-svg](https://github.com/software-mansion/react-native-svg) |
| **State Management** | React Context API + Custom Hooks (`useFinance`, `useWallet`, `useCategories`, `useQuran`, dll) |
| **Storage Lokal** | [@react-native-async-storage/async-storage](https://github.com/react-native-async-storage/async-storage) |
| **AI / OCR Service** | Google Gemini Vision API + Custom Regex Heuristics Parser |
| **Cloud Sync** | Google Drive REST API v3 via `expo-auth-session` |
| **Kamera & Gambar** | `expo-image-picker` & `expo-file-system` |
| **Audio Player** | `expo-audio` |
| **Notifikasi** | `expo-notifications` (Local System Notifications) |
| **Spreadsheet Engine** | [xlsx](https://www.npmjs.com/package/xlsx) + `expo-sharing` & `expo-document-picker` |
| **Ikon Vektor** | `@expo/vector-icons` (Ionicons, MaterialCommunityIcons, Feather) |

---

## 🚀 Langkah Cepat Setup & Menjalankan

### Prasyarat
Pastikan komputer Anda sudah terinstal:
- [Node.js](https://nodejs.org/) (Versi 18 LTS atau 20 LTS disarankan)
- Git
- Ponsel Android dengan aplikasi **Expo Go** atau Android Emulator

---

### 1. Clone Repository
```bash
git clone https://github.com/haikal-266/MY-APPS.git
cd "MY APPS"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Jalankan Aplikasi di Mode Development
```bash
npm start
```
Atau:
```bash
npx expo start
```

### 4. Buka di Perangkat Anda:
- **Ponsel Fisik (Rekomendasi):** Buka aplikasi **Expo Go** di HP Android Anda, lalu scan QR Code yang muncul di terminal.
- **Android Emulator:** Tekan tombol `a` di terminal.
- **Web Browser:** Tekan tombol `w` di terminal.

---

## 📦 Cara Build APK Release (Hemat Ukuran ~18 MB)

Proyek ini telah dikonfigurasi dengan optimasi **R8 Code Minification**, **Resource Shrinking**, dan **ABI Splits**, menghasilkan ukuran file APK sekitar **15 – 19 MB** (bukan 70+ MB fat bundle).

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

3. File APK siap install berada di:
   ```
   android/app/build/outputs/apk/release/
   ```
   - **`app-arm64-v8a-release.apk`** (**~18 MB**): Direkomendasikan untuk 99% smartphone Android modern.
   - **`app-armeabi-v7a-release.apk`**: Untuk perangkat Android 32-bit.
   - **`app-universal-release.apk`**: Paket universal untuk seluruh jenis arsitektur.

---

## 📁 Struktur Folder

```text
├── android/                    # Konfigurasi native Android (Gradle, Proguard, ABI splits)
├── assets/                     # Ikon aplikasi, splash screen, dan aset visual
├── scripts/                    # Skrip generator dataset Al-Quran Kemenag RI
├── src/
│   ├── components/             # Komponen UI modular
│   │   ├── common/             # Komponen umum (CategoryIcon, CategoryPickerModal, dll)
│   │   ├── finance/            # Modul keuangan (WalletCarousel, ReceiptReview, AddCategory, dll)
│   │   ├── neo/                # Komponen dasar Neo-Brutalism (NeoCard, NeoButton, NeoModal, NeoInput)
│   │   └── quran/              # Modul Al-Quran (AyatCard, TafsirModal, ReminderModal, HadisModal)
│   ├── data/
│   │   └── quran/
│   │       ├── surahs/         # 114 File JSON Al-Quran Offline (Arab, Latin, Terjemahan, Tafsir)
│   │       └── offlineQuran.js # Modular on-demand lazy loader data surah
│   ├── i18n/                   # Lokalisasi bahasa (ID & EN)
│   ├── navigation/             # BottomTabBar kustom & swipe navigation
│   ├── screens/                # Halaman utama (QuranScreen, FinanceScreen, SettingsScreen)
│   ├── services/               # Integrasi eksternal (receiptScanner, excelExport, googleDriveSync, dll)
│   ├── stores/                 # State management (financeStore, walletStore, categoryStore, syncStore, dll)
│   ├── theme/                  # Konfigurasi token warna & tipografi Neo-Brutalist
│   └── utils/                  # Helper fungsi & utilitas (categories, formatters, parser)
├── App.js                      # Root component, Store Providers, & Navigation Setup
├── app.json                    # Konfigurasi Expo SDK 57 & Android Metadata
└── package.json                # Daftar dependencies & script runner
```

---

## 🤝 Kontribusi

Kontribusi, laporan bug, dan ide fitur baru sangat diterima:
1. Fork repository ini
2. Buat branch fitur (`git checkout -b feature/FiturKeren`)
3. Commit perubahan Anda (`git commit -m 'Menambahkan Fitur Keren'`)
4. Push ke branch (`git push origin feature/FiturKeren`)
5. Buat **Pull Request**

---

## 📄 Lisensi

Didistribusikan di bawah Lisensi MIT. Lihat file `LICENSE` untuk rincian selengkapnya.

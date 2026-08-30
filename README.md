# DalAy - Daily Ayah & Personal Finance

<div align="center">

![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-SDK_57-000020?style=for-the-badge&logo=expo&logoColor=white)
![Android](https://img.shields.io/badge/Android-APK-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![Design](https://img.shields.io/badge/UI_Design-Neo--Brutalism-F59E0B?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**Aplikasi Mobile Produktivitas Muslim & Manajemen Keuangan Pribadi dengan Desain Neo-Brutalist yang Modern, Bersih, dan Cepat.**

[Fitur Utama](#fitur-utama) • [Instalasi Cepat](#langkah-cepat-setup--menjalankan) • [Cara Build APK](#cara-build-apk-release-hemat-ukuran--18-mb) • [Struktur Proyek](#struktur-folder)

</div>

---

## Fitur Utama

### 1. Al-Quran & Spiritual (100% Offline)
- **Akses Offline Lengkap:** 114 Surah (6.236 Ayat) lengkap dengan teks Arab (Rasm Utsmani), transliterasi Latin, dan terjemahan Bahasa Indonesia & Inggris.
- **Tafsir Ringkas / Wajiz Kemenag RI:** Tafsir ringkas resmi dari Kementerian Agama RI dapat dibaca instan tanpa memerlukan kuota internet.
- **Pemuatan On-Demand (*Lazy Loading*):** Setiap surah dimuat secara modular ke RAM (~150 KB), menjamin aplikasi sangat ringan dan efisien.
- **Pemutar Murottal:** Audio streaming ayat per ayat (Syekh Misyari Rasyid Al-Afasi).
- **Pengingat Harian & Notifikasi:** Pengingat bacaan ayat harian yang dijadwalkan langsung ke notification tray sistem Android/iOS.
- **Hadits Pilihan & Penanda Favorit:** Kumpulan hadits shahih tematik dan fitur bookmark ayat favorit.

### 2. Keuangan Pribadi (Finance Manager)
- **Smart Quick Input:** Deteksi otomatis pencatatan transaksi dari teks bebas (contoh: *"makan siang 25k, bensin 15rb"*).
- **Multi-Wallet:** Kelola berbagai jenis dompet (Tunai, Rekening Bank, E-Wallet, atau Dompet Kustom).
- **Transfer Antar Dompet:** Pindahkan saldo antar dompet/rekening secara fleksibel dengan live simulasi saldo dan opsi biaya admin.
- **Filter Kategori & Kalender Carousel:** Navigasi tanggal per 5 hari dan penyaringan transaksi berdasarkan kategori pengeluaran/pemasukan.
- **Export Laporan ke Excel (`.xlsx`):** Unduh riwayat keuangan ke format spreadsheet Excel untuk pembukuan lebih lanjut.
- **Visual & Statistik:** Grafik ringkasan pengeluaran, persentase kategori, dan total kekayaan bersih.

### 3. Tampilan & Pengalaman Pengguna (UX)
- **Neo-Brutalism Style:** Estetika berkarakter dengan garis tepi kontras, bayangan tegas, dan tipografi modern.
- **Dark Mode & Light Mode:** Mendukung tema gelap dan terang secara konsisten.
- **Bilingual:** Dukungan penuh untuk Bahasa Indonesia dan Bahasa Inggris.

---

## Tech Stack

- **Framework:** [React Native](https://reactnative.dev/) (v0.86) + [Expo](https://expo.dev/) (SDK 57)
- **Language:** JavaScript (ESNext)
- **State Management:** React Context API + [AsyncStorage](https://github.com/react-native-async-storage/async-storage)
- **Data Persistence:** File JSON offline lokal (114 Surah Kemenag RI) + AsyncStorage
- **Notification:** [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) (Local notifications)
- **Audio:** [expo-audio](https://docs.expo.dev/versions/latest/sdk/audio/)
- **Spreadsheet Engine:** [xlsx](https://www.npmjs.com/package/xlsx)
- **Vector Icons:** `@expo/vector-icons` (Ionicons)

---

## Langkah Cepat Setup & Menjalankan

### Prasyarat
Pastikan komputer Anda sudah terinstal:
- [Node.js](https://nodejs.org/) (Versi 18 LTS atau lebih baru)
- Git
- Ponsel Android dengan aplikasi **Expo Go** (download dari Google Play Store) atau Android Emulator.

---

### 1. Clone Repository
```bash
git clone https://github.com/username/dalay.git
cd dalay
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

## Cara Build APK Release (Hemat Ukuran ~18 MB)

Proyek ini telah dikonfigurasi dengan **R8 Code Minification**, **Resource Shrinker**, dan **ABI Splits**. Ukuran APK untuk smartphone modern adalah sekitar **15 – 19 MB** (bukan 70 MB fat APK).

### Langkah Build APK Standalone:

1. Buka folder `android/`:
   ```bash
   cd android
   ```

2. Jalankan perintah build Gradle:
   - **Linux / macOS:**
     ```bash
     ./gradlew assembleRelease
     ```
   - **Windows (PowerShell / Command Prompt):**
     ```bash
     .\gradlew assembleRelease
     ```

3. Temukan file APK siap pakai di:
   ```
   android/app/build/outputs/apk/release/
   ```
   - **`app-arm64-v8a-release.apk`** (**~18 MB**): Gunakan file ini untuk di-install ke 99% smartphone Android masa kini.
   - **`app-universal-release.apk`**: Versi universal untuk seluruh arsitektur perangkat.

---

## Struktur Folder

```text
├── android/                    # Konfigurasi native Android (Gradle, Proguard, Manifest)
├── assets/                     # Ikon aplikasi, splash screen, dan gambar
├── scripts/                    # Skrip utilitas developer (dataset generator)
├── src/
│   ├── components/             # Komponen UI modular
│   │   ├── finance/            # Komponen Keuangan (WalletCarousel, QuickInput, TransferModal, dll)
│   │   ├── neo/                # Komponen Desain Neo-Brutalist (NeoCard, NeoButton, NeoModal)
│   │   └── quran/              # Komponen Al-Quran (AyatCard, TafsirModal, ReminderModal, dll)
│   ├── data/
│   │   └── quran/
│   │       ├── surahs/         # 114 File JSON Al-Quran Offline (Arab, Latin, Terjemahan, Tafsir)
│   │       └── offlineQuran.js # Lazy Loader data Al-Quran
│   ├── i18n/                   # Lokalisasi bahasa (ID & EN)
│   ├── screens/                # Halaman utama aplikasi (QuranScreen & FinanceScreen)
│   ├── services/               # Integrasi API & Notifikasi (quranApi, notificationService, exportExcel)
│   ├── stores/                 # State management (quranStore, financeStore, themeStore, languageStore)
│   ├── theme/                  # Konfigurasi tema warna & tipografi
│   └── utils/                  # Data bantu & helper (surahData, currency)
├── App.js                      # Root component & Navigation provider
├── app.json                    # Konfigurasi Expo & App Metadata
└── package.json                # Dependencies & script proyek
```

---

## Kontribusi

Kontribusi, laporan bug, dan saran fitur baru sangat terbuka:
1. Fork repository ini
2. Buat branch fitur baru (`git checkout -b feature/NamaFitur`)
3. Commit perubahan Anda (`git commit -m 'Menambahkan Fitur Baru'`)
4. Push ke branch Anda (`git push origin feature/NamaFitur`)
5. Ajukan **Pull Request**

---

## Lisensi

Didistribusikan di bawah Lisensi MIT. Lihat file `LICENSE` untuk informasi selengkapnya.

# DalAy - Daily Quran & Smart Personal Finance

<div align="center">

![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-SDK_57-000020?style=for-the-badge&logo=expo&logoColor=white)
![Database](https://img.shields.io/badge/Database-Expo_SQLite_(WAL)-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Android_%7C_iOS_%7C_Tablet-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![Design](https://img.shields.io/badge/UI_Design-Neo--Brutalism-F59E0B?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**A high-performance Muslim productivity and AI-powered personal finance mobile application built with React Native, Expo, and a modern Neo-Brutalist design.**

[Features](#features) • [Tech Stack](#tech-stack) • [Developer Setup Guide](#developer-setup-guide) • [Architecture & Core Concepts](#architecture--core-concepts) • [Building Release APK](#building-release-apk) • [Project Structure](#project-structure) • [Troubleshooting](#troubleshooting)

</div>

---

## Features

### 1. Quran, Tafsir & Spiritual (100% Offline)
- **Complete 114 Surahs (6,236 Ayahs):** Authentic Uthmani Arabic script, Latin transliteration, and official translations (Indonesian & English).
- **Concise Tafsir (Wajiz Kemenag RI):** Official concise commentary accessible instantly without an active internet connection.
- **Modular Lazy Loading:** Surahs are loaded on-demand (~150 KB per surah), keeping memory consumption low and preventing UI frame drops.
- **Audio Recitation Streaming:** Ayah-by-ayah audio player featuring Sheikh Mishary Rashid Alafasy.
- **Thematic Hadith Collections:** Curated daily hadiths with options to switch narrators and share excerpts.
- **Bookmarks & Reading History:** Automatic persistence of saved ayahs and recent reading progress via local SQLite.

### 2. Smart Finance & Voice AI Input
- **Local Relational Database (Expo SQLite):** High-throughput storage with Write-Ahead Logging (WAL) mode and an Optimistic UI pattern (0ms user-perceived latency).
- **Push-to-Talk Voice Transactions:** Natural language voice-based bookkeeping with automatic recognition of amount, item name, and transaction type (income vs. expense).
- **AI Receipt Scanner (OCR & Gemini Vision):** Extract merchant names, transaction dates, totals, categories, and itemized breakdowns directly from receipt photos.
- **Smart Quick Input Bar:** Single-line text transaction parser (e.g., *"lunch 25k bca"*, *"fuel 50k cash"*).
- **Multi-Account & Wallet Management:** Track cash, bank accounts, and e-wallets with reconciliation tools and balance audit adjustments.
- **Inter-Wallet Transfers:** Live sender/receiver balance simulation with configurable administration fees.
- **Excel Import & Export (`.xlsx`):** Generate downloadable monthly spreadsheets or import historical transaction batches.
- **Visual Analytics & Donut Charts:** Interactive spending breakdowns by category with total net worth calculation.

### 3. Design, Theming & UX
- **Neo-Brutalist Aesthetic:** High-contrast borders, solid shadows, crisp geometric structures, and clean typography.
- **6 Curated Theme Presets:** Modern Teal, Emerald Oasis, Sunset Gold, Ocean Royal, Rose Blossom, and Dark Luxe (OLED Black).
- **Floating Screen Toast:** Non-blocking top banner toast notifications decoupled from scroll position.
- **Adaptive Tablet Support:** Automatic dual-pane landscape orientation and layout for screens >= 600dp.
- **Gesture-Driven Navigation:** Smooth horizontal swipe navigation between primary tabs.
- **Full Bilingual Localization:** Complete Indonesian and English language support.

---

## Tech Stack

| Layer | Technology & Version |
|---|---|
| **Framework** | [React Native](https://reactnative.dev/) `0.86.3` + [Expo](https://expo.dev/) SDK `~57.0.18` |
| **Language** | JavaScript (ESNext) |
| **Primary Database** | [`expo-sqlite`](https://docs.expo.dev/versions/latest/sdk/sqlite/) (`dalay.db` SQLite v3, WAL mode) |
| **Secondary Storage** | `@react-native-async-storage/async-storage` (UI preferences & auth sessions) |
| **Speech Recognition** | `expo-speech-recognition` |
| **AI / OCR Service** | Google Gemini Vision & Text API (`@google/genai` / REST) |
| **Cloud Sync** | Google Drive REST API v3 via `expo-auth-session` |
| **Audio Playback** | `expo-audio` |
| **Spreadsheet Engine** | `xlsx` + `expo-sharing` & `expo-document-picker` |
| **Icons & Typography** | `@expo/vector-icons` (Ionicons, MaterialCommunityIcons) |

---

## Developer Setup Guide

Follow these steps to set up the development environment on a new machine.

### 1. Prerequisites
- **Node.js:** Version **18 LTS** or **20 LTS** (`>= 18.18.0` recommended).
- **npm:** Version `>= 9.0.0`.
- **Git**
- **Mobile Device:** Smartphone with the **Expo Go** app installed (from Google Play or Apple App Store), or Android Studio / Xcode emulator.

---

### 2. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/haikal-266/MY-APPS.git

# Navigate to project root
cd "MY APPS"

# Install dependencies
npm install
```

> **Note:** Avoid using `--legacy-peer-deps` unless strictly necessary. All package versions are aligned for Expo SDK 57 and React 19.

---

### 3. Running the Development Server

Select the command corresponding to your network environment:

#### Option A: Tunnel Mode (Recommended)
Use tunnel mode if your phone and computer are on **different networks, using cellular data, mobile hotspots**, or if the local QR code fails to connect:
```bash
npm run start:tunnel
```
*This uses `@expo/ngrok` to establish a secure public tunnel directly to your local Metro bundler.*

#### Option B: Standard Local Mode
If your development machine and phone are connected to the exact same local Wi-Fi network:
```bash
npm start
```

#### Option C: Reset & Clear Bundler Cache
If you encounter stale bundling issues or phantom syntax errors:
```bash
npm run start:clear
```

---

### 4. Automated Testing & Type Checking

DalAy dilengkapi dengan rangkaian unit testing otomatis (Jest) dan type checking (TypeScript) untuk memastikan integritas logika keuangan, parser suara, dan database:

```bash
# Jalankan seluruh unit testing (otomatis jalan sebelum npm start)
npm test

# Mode watch (interaktif saat koding)
npm run test:watch

# Type check via TypeScript compiler
npm run type-check
```

*Setiap kali menjalankan `npm start`, `npm run start:tunnel`, atau `npm run start:clear`, seluruh unit test akan otomatis dieksekusi terlebih dahulu melalui lifecycle hook `prestart`.*

---

### 5. Opening on Your Device
1. **Physical Device (Expo Go):** Open **Expo Go** on your phone, select **Scan QR Code**, and scan the QR code printed in your terminal.
2. **Android Emulator:** Press `a` in the terminal while Metro is running.
3. **Developer Menu:** Shake the physical device or press `m` in the terminal to access reload and debugging options.

---

## Architecture & Core Concepts

Key architectural patterns for developers contributing to this codebase:

### 1. Database & Storage Layer (`src/services/database.js`)
- Financial transactions, wallets, custom categories, and Quran items are stored in **SQLite (`dalay.db`)**.
- **Optimistic UI Pattern:** React state is updated synchronously in memory (**0ms UI latency**), while SQLite operations (`INSERT`, `UPDATE`, `DELETE`) execute asynchronously in the background.
- **Schema Migrations:** Database versioning is governed by `SCHEMA_VERSION` in `src/services/database.js`. To add or alter tables/columns, increment `SCHEMA_VERSION` and define the required DDL inside `runSchemaMigration()`.
- **Automatic Migration:** The app includes a one-time migration routine that transfers existing user data from legacy AsyncStorage keys to SQLite.

### 2. Voice Transaction Processing (`src/hooks/useVoiceInput.js` & `src/services/voiceService.js`)
- Uses `expo-speech-recognition` for on-device voice capture.
- The parser extracts amounts, labels, and classifies transaction types using regex heuristics:
  - **Income:** Keywords such as *"pemasukan"*, *"masuk"*, *"gaji"*, *"income"*, etc.
  - **Expense:** Defaults to expense or keywords such as *"pengeluaran"*, *"keluar"*, *"beli"*, *"bayar"*, etc.

### 3. Theme Engine (`src/theme/themes.js` & `src/stores/themeStore.js`)
- Hardcoded color literals in components are prohibited. Always consume dynamic theme tokens via the `useTheme()` hook:
  ```javascript
  import { useTheme } from '../stores/themeStore';
  const { colors, isDark } = useTheme();
  ```
- 6 curated theme palettes are defined in `src/theme/themes.js`: `teal`, `emerald`, `amber`, `royal_blue`, `rose`, and `dark_luxe`.

### 4. Unified Floating Toast System
- All primary screens (`QuranScreen`, `FinanceScreen`, `SettingsScreen`) use a consistent, non-intrusive floating toast overlay (`styles.floatingScreenToast`) positioned with `position: 'absolute'`, `top: 24/52`, `zIndex: 9999`, and `pointerEvents="none"`.

---

## Building Release APK

The project is pre-configured with **R8 code minification**, **resource shrinking**, and **ABI splits**, resulting in a standalone APK of approximately **15 – 19 MB** (instead of a 70+ MB fat bundle).

### Steps to Build Standalone APK:

1. Navigate to the `android/` directory:
   ```bash
   cd android
   ```

2. Execute the Gradle build command:
   - **Windows (PowerShell / CMD):**
     ```powershell
     .\gradlew assembleRelease
     ```
   - **Linux / macOS:**
     ```bash
     ./gradlew assembleRelease
     ```

3. Compiled APK outputs are located at:
   ```
   android/app/build/outputs/apk/release/
   ```
   - **`app-arm64-v8a-release.apk`** (**~18 MB**): Recommended for 99% of modern Android devices.
   - **`app-armeabi-v7a-release.apk`**: For legacy 32-bit Android hardware.
   - **`app-universal-release.apk`**: Universal package containing all architectures.

---

## Project Structure

```text
├── android/                    # Native Android project configuration (Gradle, Proguard, ABI splits)
├── assets/                     # Application icons, splash screens, and visual assets
├── scripts/                    # Dataset generators and parsers
├── src/
│   ├── components/             # Modular UI components
│   │   ├── common/             # Shared components (CategoryIcon, CategoryPickerModal, etc.)
│   │   ├── finance/            # Finance components (WalletCarousel, TransactionList, QuickInput, etc.)
│   │   ├── neo/                # Neo-Brutalist primitives (NeoCard, NeoButton, NeoModal, NeoInput)
│   │   ├── quran/              # Quran components (AyatCard, TafsirModal, RandomHadithCard, ReminderModal)
│   │   ├── settings/           # Settings cards (GeminiAiCard, GoogleSyncCard, etc.)
│   │   ├── sync/               # Cloud sync UI
│   │   └── voice/              # Voice input UI (PushToTalkButton, VoiceListeningOverlay)
│   ├── data/
│   │   └── quran/
│   │       ├── surahs/         # 114 Offline JSON surah files (Arabic, transliteration, translation, tafsir)
│   │       └── offlineQuran.js # Modular lazy loader
│   ├── hooks/                  # Custom React hooks (useVoiceInput, useReceiptScanner, etc.)
│   ├── i18n/                   # Localization files (translations.js: Indonesian & English)
│   ├── navigation/             # BottomTabBar and TabletRightNavRail
│   ├── screens/                # Primary screens (QuranScreen, FinanceScreen, SettingsScreen)
│   ├── services/               # Core services & data layer
│   │   ├── database.js         # SQLite layer, schema DDL, versioned migrations, and CRUD helpers
│   │   ├── receiptScanner.js   # Gemini OCR & receipt data extraction
│   │   ├── excelExport.js      # Excel spreadsheet generation & import
│   │   ├── googleDriveSync.js  # Google Drive cloud backup & restore
│   │   └── notificationService.js # Local scheduled reminder notifications
│   ├── stores/                 # Context state stores (financeStore, walletStore, quranStore, themeStore, etc.)
│   ├── theme/                  # Theme definitions, typography, and Neo-Brutalist constants
│   └── utils/                  # Helper utilities (formatters, textFormatter, surahData, categories)
├── App.js                      # Root component, database bootstrap, and provider hierarchy
├── app.json                    # Expo SDK 57 manifest and Android build metadata
└── package.json                # Project dependencies, scripts, and dev tools
```

---

## Troubleshooting

### 1. Device Cannot Scan QR Code / "Network response timed out"
- **Solution:** Run Metro in tunnel mode:
  ```bash
  npm run start:tunnel
  ```
  Ensure your mobile device has active internet access.

### 2. Metro Bundler Cache Issues / Phantom Errors
- **Solution:** Clear the bundler cache:
  ```bash
  npm run start:clear
  ```

### 3. SQLite Database Initialization
- Database initialization and schema creation are handled automatically on app launch by `initializeDatabase()` in `App.js`.
- If modifying table structures, increment `SCHEMA_VERSION` in [src/services/database.js](file:///c:/Users/KallKun/Documents/Kuliah/MY%20APPS/src/services/database.js) and add corresponding migration steps in `runSchemaMigration()`.

### 4. Gemini API Key Configuration
- Users can input their personal Gemini API key under **Settings > Gemini AI Settings**.
- Keys are stored securely in local device storage.

---

## Contributing

1. Fork or branch from `master`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Verify code syntax:
   ```bash
   node -c src/services/database.js
   ```
3. Commit your changes with descriptive commit messages:
   ```bash
   git commit -m "feat: add feature description"
   ```
4. Open a Pull Request against the `master` branch.

---

## License

This project is open-source software licensed under the [MIT License](LICENSE).

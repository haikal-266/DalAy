import packageJson from '../../package.json';

/**
 * Single Source of Truth for DalAy Application Information & Versioning
 */
export const APP_INFO = {
  name: 'DalAy',
  fullName: 'DalAy (Daily Ayah & Finance)',
  slug: 'dalay',
  version: packageJson.version || '3.0.0',
  buildLabel: 'AI Vision & Multi-Wallet',
  tagline: 'Quran Reminder & Smart Finance',

  features: [
    {
      id: 'ai_vision_receipt',
      titleId: 'Scan Struk AI 3.6',
      titleEn: 'AI Receipt Scanner 3.6',
      descId: 'Ekstrak total & rincian instan.',
      descEn: 'Instant total & item extraction.',
      icon: 'sparkles-outline',
    },
    {
      id: 'bg_process_notif',
      titleId: 'Background & Push Notif',
      titleEn: 'Background & Push Notif',
      descId: 'Proses di latar belakang & HP.',
      descEn: 'Background processing & alerts.',
      icon: 'notifications-outline',
    },
    {
      id: 'slick_category_modal',
      titleId: 'Pop-Up Kategori',
      titleEn: 'Category Pop-Up',
      descId: 'Pilih & cari kategori cepat.',
      descEn: 'Quick category search & select.',
      icon: 'grid-outline',
    },
    {
      id: 'multi_wallet',
      titleId: 'Multi Dompet',
      titleEn: 'Multi-Wallet',
      descId: 'Kelola kas, bank & e-wallet.',
      descEn: 'Manage cash, bank & e-wallets.',
      icon: 'wallet-outline',
    },
    {
      id: 'daily_quran',
      titleId: 'Daily Ayah & Auto Boot',
      titleEn: 'Daily Ayah & Auto Boot',
      descId: 'Pengingat berkala otomatis HP.',
      descEn: 'Auto restored Quran reminders.',
      icon: 'book-outline',
    },
  ],

  getVersionBadgeText: (isIndonesian = true) => {
    const prefix = isIndonesian ? 'Versi' : 'Version';
    return `${prefix} ${packageJson.version || '3.0.0'} • Pro`;
  },
};

export default APP_INFO;

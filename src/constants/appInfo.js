import packageJson from '../../package.json';

/**
 * Single Source of Truth for DalAy Application Information & Versioning
 */
export const APP_INFO = {
  name: 'DalAy',
  fullName: 'DalAy (Daily Ayah)',
  slug: 'dalay',
  version: packageJson.version || '1.5.0',
  buildLabel: 'Multi Wallet',
  tagline: 'Daily Quran Reminder & Smart Finance Tracker',

  /**
   * Helper to format localized version text badge
   * @param {boolean} isIndonesian
   * @returns {string} e.g. "Versi 1.5.0 • Multi Wallet"
   */
  getVersionBadgeText: (isIndonesian = true) => {
    const prefix = isIndonesian ? 'Versi' : 'Version';
    return `${prefix} ${packageJson.version || '1.5.0'} • Multi Wallet`;
  },
};

export default APP_INFO;

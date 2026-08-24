// Formatters for Currency, Dates, and Time

export const formatRupiah = (amount = 0, includePrefix = true) => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const formatted = Math.abs(num)
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  if (!includePrefix) return formatted;
  const prefix = num < 0 ? '-Rp ' : 'Rp ';
  return `${prefix}${formatted}`;
};

export const formatCompact = (amount = 0) => {
  const num = Math.abs(typeof amount === 'number' ? amount : parseFloat(amount) || 0);
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1).replace('.0', '')} M`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace('.0', '')} Jt`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(0)} Rb`;
  }
  return `${num}`;
};

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const DAY_NAMES = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

export const formatDateIndo = (dateInput, includeDay = false, isShort = false) => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const dayName = DAY_NAMES[d.getDay()];
  const date = d.getDate();
  const month = isShort ? MONTH_NAMES_SHORT[d.getMonth()] : MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();

  if (includeDay) {
    return `${dayName}, ${date} ${month} ${year}`;
  }
  return `${date} ${month} ${year}`;
};

export const formatTimeIndo = (dateInput) => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} WIB`;
};

export const getRelativeDateLabel = (dateInput) => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  if (isToday) return 'Hari Ini';

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Kemarin';

  return formatDateIndo(d, true, true);
};

export const isSameDay = (d1, d2) => {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

export const isThisWeek = (dateInput) => {
  const d = new Date(dateInput);
  const today = new Date();
  const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
  firstDay.setHours(0, 0, 0, 0);
  return d >= firstDay;
};

export const isThisMonth = (dateInput) => {
  const d = new Date(dateInput);
  const today = new Date();
  return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
};

export default {
  formatRupiah,
  formatCompact,
  formatDateIndo,
  formatTimeIndo,
  getRelativeDateLabel,
  isSameDay,
  isThisWeek,
  isThisMonth,
};

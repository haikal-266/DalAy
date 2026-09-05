export const EXPENSE_CATEGORIES = [
  {
    id: 'food',
    name: 'Makanan & Minuman',
    iconName: 'fast-food',
    iconFamily: 'Ionicons',
    color: '#D97706',      // Amber 600
    bgColor: '#FEF3C7',    // Amber 100
    keywords: [
      'kopi susu', 'nasi padang', 'makan siang', 'makan malam', 'sarapan pagi',
      'ayam geprek', 'ayam bakar', 'ayam goreng', 'mie ayam', 'es teh', 'jus buah',
      'makan', 'warteg', 'nasi', 'ayam', 'kopi', 'teh', 'boba', 'grabfood', 'gofood', 'shopeefood',
      'kantin', 'roti', 'cemilan', 'sarapan', 'lunch', 'dinner', 'padang', 'indomie',
      'soto', 'mie', 'bakso', 'jus', 'snack', 'burger', 'pizza', 'cafe', 'resto', 'restoran',
      'drink', 'food', 'martabak', 'sate', 'bebek', 'gorengan', 'coffee', 'coffe', 'kuliner'
    ],
  },
  {
    id: 'transport',
    name: 'Transportasi & Kendaraan',
    iconName: 'car',
    iconFamily: 'Ionicons',
    color: '#0284C7',      // Sky 600
    bgColor: '#E0F2FE',    // Sky 100
    keywords: [
      'tambal ban', 'cuci motor', 'cuci mobil', 'servis motor', 'servis mobil', 'ganti oli',
      'isi bensin', 'tiket kereta', 'tiket pesawat', 'tiket bus', 'e-toll', 'isi saldo tol',
      'bensin', 'pertalite', 'pertamax', 'solar', 'dexlite', 'spbu', 'parkir', 'tol', 'etoll',
      'grab', 'gojek', 'ojol', 'krl', 'mrt', 'lrt', 'busway', 'transjakarta', 'angkot',
      'servis', 'service', 'motor', 'mobil', 'tiket', 'goride', 'grabcar', 'gocar', 'maxim',
      'oli', 'kereta', 'helm', 'ban motor', 'ban mobil', 'kampas rem', 'aki motor', 'aki mobil',
      'bengkel', 'sparepart', 'kendaraan', 'ojek', 'taksi', 'travel'
    ],
  },
  {
    id: 'tech',
    name: 'Teknologi & Gadget',
    iconName: 'laptop',
    iconFamily: 'Ionicons',
    color: '#4F46E5',      // Indigo 600
    bgColor: '#EEF2FF',    // Indigo 100
    keywords: [
      'kabel data', 'kabel charger', 'power bank', 'headphone bluetooth', 'earphone bluetooth',
      'casing hp', 'tempered glass', 'casing pc', 'hardisk eksternal', 'ssd nvme',
      'laptop', 'macbook', 'hp', 'handphone', 'smartphone', 'iphone', 'samsung', 'xiaomi',
      'ipad', 'tablet', 'pc', 'komputer', 'monitor', 'ram', 'ssd', 'vga', 'gpu', 'cpu',
      'mouse', 'keyboard', 'charger', 'kabel', 'iem', 'tws', 'earphone', 'headphone', 'headset',
      'powerbank', 'hardisk', 'flashdisk', 'mic', 'microphone', 'webcam', 'gadget',
      'elektronik', 'software', 'lisensi', 'domain', 'hosting', 'cloud', 'eartips'
    ],
  },
  {
    id: 'work',
    name: 'Kebutuhan Kerja & Usaha',
    iconName: 'briefcase',
    iconFamily: 'Ionicons',
    color: '#0891B2',      // Cyan 600
    bgColor: '#CFFAFE',    // Cyan 100
    keywords: [
      'buat kerja', 'untuk kerja', 'keperluan kerja', 'kebutuhan kantor', 'modal usaha',
      'iklan fb', 'iklan ig', 'google ads', 'fb ads', 'tiktok ads', 'cetak brosur',
      'kerja', 'kantor', 'meeting', 'bisnis', 'modal', 'jualan', 'stok', 'supplier',
      'materai', 'rekrutmen', 'iklan', 'ads', 'prospek', 'seragam kerja', 'peralatan kerja',
      'alat kerja', 'operasional'
    ],
  },
  {
    id: 'shopping',
    name: 'Belanja & Lifestyle',
    iconName: 'bag-handle',
    iconFamily: 'Ionicons',
    color: '#DB2777',      // Pink 600
    bgColor: '#FCE7F3',    // Pink 100
    keywords: [
      'jam tangan', 'smartwatch', 'kacamata hitam', 'tali pinggang', 'jajan', 'beli', 'belanja',
      'indomaret', 'alfamart', 'shopee', 'tokped', 'tokopedia',
      'lazada', 'tiktok shop', 'sabun', 'baju', 'celana', 'sepatu', 'sandal', 'minimarket',
      'supermarket', 'pasar', 'fashion', 'skincare', 'sampo', 'deterjen', 'toko',
      'kaos', 'tas', 'jaket', 'parfum', 'aksesoris', 'checkout', 'barang', 'kado', 'jam', 'dompet', 'cincin', 'kalung'
    ],
  },
  {
    id: 'bills',
    name: 'Tagihan & Rumah',
    iconName: 'home',
    iconFamily: 'Ionicons',
    color: '#7C3AED',      // Violet 600
    bgColor: '#EDE9FE',    // Violet 100
    keywords: [
      'bayar kos', 'bayar listrik', 'token listrik', 'paket data', 'tagihan wifi',
      'listrik', 'pln', 'token', 'pdam', 'air', 'wifi', 'indihome', 'biznet', 'myrepublic',
      'internet', 'pulsa', 'kuota', 'kos', 'kost', 'kontrakan', 'sewa',
      'galon', 'gas', 'elpiji', 'iuran', 'sampah', 'kebersihan', 'pbb', 'maintenance', 'ipl'
    ],
  },
  {
    id: 'health',
    name: 'Kesehatan & Medis',
    iconName: 'medkit',
    iconFamily: 'Ionicons',
    color: '#059669',      // Emerald 600
    bgColor: '#D1FAE5',    // Emerald 100
    keywords: [
      'rumah sakit', 'periksa dokter', 'beli obat', 'tes darah',
      'obat', 'apotek', 'dokter', 'klinik', 'rs', 'vitamin', 'periksa',
      'bpjs', 'pcr', 'antigen', 'masker', 'terapi', 'suplemen', 'paracetamol', 'panadol',
      'betadine', 'perban', 'koyo', 'kacamata', 'softlens'
    ],
  },
  {
    id: 'education',
    name: 'Pendidikan & Belajar',
    iconName: 'school',
    iconFamily: 'Ionicons',
    color: '#2563EB',      // Blue 600
    bgColor: '#DBEAFE',    // Blue 100
    keywords: [
      'alat tulis', 'biaya kuliah', 'bayar spp', 'bayar ukt', 'kursus online',
      'buku', 'novel', 'kursus', 'les', 'sekolah', 'kuliah', 'spp', 'ukt', 'modul',
      'seminar', 'bootcamp', 'fotokopi', 'pulpen', 'pensil', 'ujian',
      'kertas', 'print', 'jilid', 'ebook', 'training'
    ],
  },
  {
    id: 'entertainment',
    name: 'Hiburan & Hobi',
    iconName: 'game-controller',
    iconFamily: 'Ionicons',
    color: '#E11D48',      // Rose 600
    bgColor: '#FFE4E6',    // Rose 100
    keywords: [
      'tiket konser', 'nonton bioskop', 'topup game', 'sewa lapangan',
      'game', 'steam', 'bioskop', 'nonton', 'film', 'netflix', 'spotify', 'youtube',
      'jalan', 'liburan', 'hotel', 'topup', 'diamond', 'roblox',
      'genshin', 'anime', 'hobi', 'karaoke', 'playstation', 'ps', 'futsal', 'badminton'
    ],
  },
  {
    id: 'charity',
    name: 'Sedekah & Donasi',
    iconName: 'heart',
    iconFamily: 'Ionicons',
    color: '#16A34A',      // Green 600
    bgColor: '#DCFCE7',    // Green 100
    keywords: [
      'sedekah subuh', 'zakat fitrah', 'zakat mal', 'kotak amal',
      'sedekah', 'zakat', 'infaq', 'infak', 'donasi', 'sumbangan',
      'masjid', 'yatim', 'amal', 'kitabisa'
    ],
  },
  {
    id: 'other_expense',
    name: 'Lain-lain',
    iconName: 'cube',
    iconFamily: 'Ionicons',
    color: '#64748B',      // Slate 500
    bgColor: '#F1F5F9',    // Slate 100
    keywords: [],
  },
];

export const INCOME_CATEGORIES = [
  {
    id: 'salary',
    name: 'Gaji & Upah',
    iconName: 'cash',
    iconFamily: 'Ionicons',
    color: '#059669',      // Emerald 600
    bgColor: '#D1FAE5',    // Emerald 100
    keywords: ['gaji pokok', 'gaji bulanan', 'upah kerja', 'gaji', 'salary', 'gajian', 'payroll', 'upah', 'pokok', 'bulanan'],
  },
  {
    id: 'freelance',
    name: 'Freelance & Project',
    iconName: 'laptop',
    iconFamily: 'Ionicons',
    color: '#0284C7',      // Sky 600
    bgColor: '#E0F2FE',    // Sky 100
    keywords: [
      'side job', 'fee project', 'klien freelance',
      'freelance', 'project', 'proyek', 'klien', 'client', 'coding', 'ngoding',
      'desain', 'design', 'komisi', 'sidejob', 'fee', 'honor', 'jasa'
    ],
  },
  {
    id: 'business',
    name: 'Hasil Usaha & Toko',
    iconName: 'storefront',
    iconFamily: 'Ionicons',
    color: '#0891B2',      // Cyan 600
    bgColor: '#CFFAFE',    // Cyan 100
    keywords: ['omzet', 'omset', 'penjualan', 'hasil toko', 'dagangan', 'laba', 'profit usaha', 'jualan'],
  },
  {
    id: 'bonus',
    name: 'Bonus & Hadiah',
    iconName: 'gift',
    iconFamily: 'Ionicons',
    color: '#D97706',      // Amber 600
    bgColor: '#FEF3C7',    // Amber 100
    keywords: ['uang thr', 'hadiah lomba', 'bonus', 'thr', 'reward', 'hadiah', 'angpao', 'cashback', 'giveaway', 'insentif'],
  },
  {
    id: 'investment',
    name: 'Investasi & Dividen',
    iconName: 'trending-up',
    iconFamily: 'Ionicons',
    color: '#7C3AED',      // Violet 600
    bgColor: '#EDE9FE',    // Violet 100
    keywords: [
      'dividen saham', 'imbal hasil', 'cuan saham', 'cuan crypto',
      'dividen', 'bunga', 'reksadana', 'crypto', 'profit', 'return',
      'trading', 'saham', 'cuan'
    ],
  },
  {
    id: 'transfer_in',
    name: 'Transfer & Kiriman',
    iconName: 'swap-horizontal',
    iconFamily: 'Ionicons',
    color: '#DB2777',      // Pink 600
    bgColor: '#FCE7F3',    // Pink 100
    keywords: [
      'bayar utang', 'balikin duit', 'kiriman ortu', 'uang jajan',
      'transfer', 'tf', 'kiriman', 'kirim', 'refund',
      'orang tua', 'ortu', 'ayah', 'ibu', 'temen', 'teman'
    ],
  },
  {
    id: 'other_income',
    name: 'Pemasukan Lain',
    iconName: 'wallet',
    iconFamily: 'Ionicons',
    color: '#64748B',      // Slate 500
    bgColor: '#F1F5F9',    // Slate 100
    keywords: [],
  },
];

/**
 * Advanced Multi-word & Contextual Category Classifier
 * Matches whole phrases, word boundaries, and applies weighted scoring.
 * 
 * @param {string} text - Transaction description or name
 * @param {string} type - 'expense' | 'income'
 * @returns {Object} Selected Category object
 */
export const detectCategory = (text, type = 'expense') => {
  if (!text || typeof text !== 'string') {
    const fallbackList = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    return fallbackList[fallbackList.length - 1];
  }

  const cleanText = text.toLowerCase().trim();
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  let bestCategory = null;
  let highestScore = 0;

  for (const cat of categories) {
    if (!cat.keywords || cat.keywords.length === 0) continue;

    let score = 0;

    for (const keyword of cat.keywords) {
      const lowerKeyword = keyword.toLowerCase();

      // Multi-word exact phrase match (Highest Priority)
      if (lowerKeyword.includes(' ') && cleanText.includes(lowerKeyword)) {
        score += 25 + lowerKeyword.length * 2;
      } else {
        // Single word exact boundary match (e.g. \blaptop\b)
        const wordRegex = new RegExp(`\\b${escapeRegExp(lowerKeyword)}\\b`, 'i');
        if (wordRegex.test(cleanText)) {
          score += 10 + lowerKeyword.length;
        } else if (cleanText.includes(lowerKeyword)) {
          // Substring partial match (e.g. "bensinan" -> "bensin")
          score += 3 + lowerKeyword.length;
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestCategory = cat;
    }
  }

  // If a category has positive score, return it; otherwise return fallback 'Lain-lain'
  if (bestCategory && highestScore > 0) {
    return bestCategory;
  }

  return categories[categories.length - 1];
};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const getCategoryById = (id, type = 'expense') => {
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  return categories.find((c) => c.id === id) || categories[categories.length - 1];
};

export default {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  detectCategory,
  getCategoryById,
};

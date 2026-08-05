// Product Type Identification & Preset Suggestions for Returnji Physical Tags

export const TAG_TYPES = {
  REGULAR_STICKER: 'sticker',
  MINI_STICKER: 'small_sticker',
  KEYCHAIN: 'keychain'
};

export const PRODUCT_CATALOG = {
  [TAG_TYPES.REGULAR_STICKER]: {
    id: TAG_TYPES.REGULAR_STICKER,
    prefix: 'RJ-ST-',
    name: 'Returnji Regular QR Sticker',
    badge: '🏷️ Claim Returnji Regular QR Sticker',
    tagline: 'Durable, waterproof sticker ideal for medium to large personal assets.',
    headerLabel: 'Best For',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    accentColor: '#059669', // Emerald
    gradient: 'from-emerald-600 to-teal-700',
    suggestions: [
      { name: 'Laptop', emoji: '💻', defaultCategory: 'Electronics & Tech' },
      { name: 'Water Bottle', emoji: '💧', defaultCategory: 'Daily Essentials' },
      { name: 'Suitcase / Trolley Bag', emoji: '🧳', defaultCategory: 'Travel & Luggage' },
      { name: 'Notebook / Diary', emoji: '📚', defaultCategory: 'Office & Study Supplies' },
      { name: 'Lunch Box', emoji: '🍱', defaultCategory: 'Daily Essentials' },
      { name: 'Power Bank', emoji: '🔋', defaultCategory: 'Electronics & Tech' },
      { name: 'Documents Pouch', emoji: '👜', defaultCategory: 'Documents & Folders' }
    ],
    categories: [
      'Electronics & Tech',
      'Travel & Luggage',
      'Office & Study Supplies',
      'Daily Essentials',
      'Documents & Folders',
      'Sports & Fitness',
      'Other'
    ]
  },

  [TAG_TYPES.MINI_STICKER]: {
    id: TAG_TYPES.MINI_STICKER,
    prefix: 'RJ-CS-',
    name: 'Returnji Mini QR Sticker',
    badge: '🏷️ Claim Returnji Mini QR Sticker',
    tagline: 'Ultra-compact mini QR sticker tailored for small everyday essentials.',
    headerLabel: 'Best For Everyday Essentials',
    badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    accentColor: '#6366f1', // Indigo
    gradient: 'from-indigo-600 to-purple-700',
    suggestions: [
      { name: 'Earbuds Case', emoji: '🎧', defaultCategory: 'Mobile & Tech Accessories' },
      { name: 'Mobile Phone Case', emoji: '📱', defaultCategory: 'Mobile & Tech Accessories' },
      { name: 'Wallet', emoji: '💳', defaultCategory: 'Cards & Wallets' },
      { name: 'Glasses / Sunglasses Case', emoji: '🕶️', defaultCategory: 'Eyewear & Optics' },
      { name: 'Portable SSD / Hard Drive', emoji: '💾', defaultCategory: 'Storage & Media' },
      { name: 'Camera Case', emoji: '📷', defaultCategory: 'Mobile & Tech Accessories' },
      { name: 'TV / AC Remote', emoji: '🔑', defaultCategory: 'Home & Office Gadgets' }
    ],
    categories: [
      'Mobile & Tech Accessories',
      'Cards & Wallets',
      'Eyewear & Optics',
      'Storage & Media',
      'Home & Office Gadgets',
      'Other Mini Items'
    ]
  },

  [TAG_TYPES.KEYCHAIN]: {
    id: TAG_TYPES.KEYCHAIN,
    prefix: 'RJ-KC-',
    name: 'Returnji QR Keychain',
    badge: '🔑 Claim Returnji QR Keychain',
    tagline: 'Heavy-duty acrylic/metal keychain for keys, zips, and travel gear.',
    headerLabel: 'Ideal For',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    accentColor: '#d97706', // Amber
    gradient: 'from-amber-600 to-orange-700',
    suggestions: [
      { name: 'House Keys', emoji: '🔑', defaultCategory: 'Vehicle & House Keys' },
      { name: 'Car Keys', emoji: '🚗', defaultCategory: 'Vehicle & House Keys' },
      { name: 'Bike / Scooter Keys', emoji: '🏍️', defaultCategory: 'Vehicle & House Keys' },
      { name: 'Backpack', emoji: '🎒', defaultCategory: 'Backpacks & Carrying Bags' },
      { name: 'Laptop Bag', emoji: '💼', defaultCategory: 'Tech Bags & Sleeves' },
      { name: 'Travel Luggage', emoji: '🧳', defaultCategory: 'Luggage & Travel Accessories' }
    ],
    categories: [
      'Vehicle & House Keys',
      'Backpacks & Carrying Bags',
      'Luggage & Travel Accessories',
      'Tech Bags & Sleeves',
      'Other Keychains & Bags'
    ]
  }
};

/**
 * Detects tag type from database object or QR ID string prefix
 * @param {string} qrId - The QR identifier (e.g. RJ-ST-1001, RJ-CS-2002, RJ-KC-3003)
 * @param {object} qrData - Optional existing Firestore document data
 * @returns {object} The full product configuration object
 */
export function getQRProductInfo(qrId = '', qrData = null) {
  const cleanId = (qrId || '').toUpperCase().trim();
  const dbType = (qrData?.type || '').toLowerCase();

  // 1. Check direct database type field
  if (dbType === 'sticker' || dbType === 'regular_sticker') {
    return PRODUCT_CATALOG[TAG_TYPES.REGULAR_STICKER];
  }
  if (dbType === 'small_sticker' || dbType === 'mini_sticker' || dbType === 'mini') {
    return PRODUCT_CATALOG[TAG_TYPES.MINI_STICKER];
  }
  if (dbType === 'keychain' || dbType === 'kc') {
    return PRODUCT_CATALOG[TAG_TYPES.KEYCHAIN];
  }

  // 2. Check QR ID prefixes
  // Mini Sticker checks (RJ-CS-, CS-, cs)
  if (cleanId.startsWith('RJ-CS-') || cleanId.startsWith('CS-') || cleanId.startsWith('CS')) {
    return PRODUCT_CATALOG[TAG_TYPES.MINI_STICKER];
  }

  // Keychain checks (RJ-KC-, KC-, ky, ky-)
  if (cleanId.startsWith('RJ-KC-') || cleanId.startsWith('KC-') || cleanId.startsWith('KY-') || cleanId.startsWith('KY')) {
    return PRODUCT_CATALOG[TAG_TYPES.KEYCHAIN];
  }

  // Regular Sticker checks (RJ-ST-, ST-, st) or default fallback
  if (cleanId.startsWith('RJ-ST-') || cleanId.startsWith('ST-') || cleanId.startsWith('ST')) {
    return PRODUCT_CATALOG[TAG_TYPES.REGULAR_STICKER];
  }

  // Fallback default: Regular Sticker
  return PRODUCT_CATALOG[TAG_TYPES.REGULAR_STICKER];
}

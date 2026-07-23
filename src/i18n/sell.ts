import { resolveLanguageId, type LanguageId } from '@/data/languages';

export interface SellStrings {
  tabTitle: string;
  backToHome: string;
  modes: {
    keypad: string;
    items: string;
    scan: string;
  };
  totalAmount: string;
  enterServiceName: string;
  quickServices: string;
  noServicesTitle: string;
  noServicesMessage: string;
  selectServiceError: string;
  preparingCheckout: string;
  checkoutFailed: string;
  couldNotAddService: string;
  checkout: string;
  checkoutOneItem: string;
  productNotFound: string;
  cameraAccessTitle: string;
  cameraAccessMessage: string;
  grantPermission: string;
  productDetails: string;
  addToSale: string;
  searchProducts: string;
  noProductsFound: string;
  noProductsSearchHint: string;
  noProductsEmpty: string;
  allCategories: string;
  otherCategory: string;
  uncategorized: string;
  recent: string;
  filterByCategory: string;
  category: string;
  addToCart: string;
  clearAll: string;
  noItemsSelected: string;
  scanToAdd: string;
  cartEmpty: string;
  cartEmptyHint: string;
  recentProducts: string;
  noRecentTitle: string;
  noRecentMessage: string;
  selectVariant: string;
  selectVariantsHint: string;
  inStock: string;
  outOfStock: string;
  clearSelection: string;
  scanHint: string;
  lookingUpProduct: string;
  cart: string;
  productNotFoundMessage: (barcode: string) => string;
  checkoutItems: (count: number) => string;
  selectedItems: (count: number) => string;
  addToCartCount: (count: number) => string;
  addSelected: (count: number) => string;
}

const en: SellStrings = {
  tabTitle: 'Sell',
  backToHome: 'Back to home',
  modes: { keypad: 'Keypad', items: 'Items', scan: 'Scan' },
  totalAmount: 'Total Amount',
  enterServiceName: 'Enter Service Name',
  quickServices: 'Quick Services',
  noServicesTitle: 'No services available',
  noServicesMessage: 'Add service-type items to use keypad checkout',
  selectServiceError: 'Please select a service or enter a service name',
  preparingCheckout: 'Preparing checkout...',
  checkoutFailed: 'Checkout Failed',
  couldNotAddService: 'Could Not Add Service',
  checkout: 'Checkout',
  checkoutOneItem: 'Checkout (1 item)',
  productNotFound: 'Product not found',
  cameraAccessTitle: 'Camera Access Required',
  cameraAccessMessage: 'Allow camera access to scan barcodes',
  grantPermission: 'Grant Permission',
  productDetails: 'Product Details',
  addToSale: 'Add to Sale',
  searchProducts: 'Search products...',
  noProductsFound: 'No products found',
  noProductsSearchHint: 'Try a different search or category filter',
  noProductsEmpty: 'Products from inventory will appear here',
  allCategories: 'All Categories',
  otherCategory: 'Other',
  uncategorized: 'Uncategorized',
  recent: 'Recent',
  filterByCategory: 'Filter by Category',
  category: 'Category',
  addToCart: 'Add to Cart',
  clearAll: 'Clear all',
  noItemsSelected: 'No items selected',
  scanToAdd: 'Scan a barcode to add items',
  cartEmpty: 'Your cart is empty',
  cartEmptyHint: 'Scan barcodes to add items and start selling',
  recentProducts: 'Recent Products',
  noRecentTitle: 'No recent products yet',
  noRecentMessage:
    'Products from completed sales will appear here for quick re-ordering.',
  selectVariant: 'Select Variant',
  selectVariantsHint: 'Select one or more variants',
  inStock: 'In stock',
  outOfStock: 'Out of Stock',
  clearSelection: 'Clear Selection',
  scanHint: 'Align barcode within the frame',
  lookingUpProduct: 'Looking up product...',
  cart: 'Cart',
  productNotFoundMessage: (barcode) => `No product matches barcode ${barcode}`,
  checkoutItems: (count) => `Checkout (${count} items)`,
  selectedItems: (count) => `Selected Items (${count})`,
  addToCartCount: (count) => `Add to Cart (${count})`,
  addSelected: (count) => `Add Selected (${count})`,
};

const am: SellStrings = {
  tabTitle: 'ሽያጭ',
  backToHome: 'ወደ መነሻ ተመለስ',
  modes: { keypad: 'ኪፓድ', items: 'ዕቃዎች', scan: 'ስካን' },
  totalAmount: 'ጠቅላላ መጠን',
  enterServiceName: 'የአገልግሎት ስም ያስገቡ',
  quickServices: 'ፈጣን አገልግሎቶች',
  noServicesTitle: 'ምንም አገልግሎት የለም',
  noServicesMessage: 'ኪፓድ ቼክአውት ለመጠቀም የአገልግሎት ዓይነት ዕቃዎችን ያክሉ',
  selectServiceError: 'እባክዎ አገልግሎት ይምረጡ ወይም የአገልግሎት ስም ያስገቡ',
  preparingCheckout: 'ቼክአውት በማዘጋጀት ላይ...',
  checkoutFailed: 'ቼክአውት አልተሳካም',
  couldNotAddService: 'አገልግሎት ማከል አልተቻለም',
  checkout: 'ቼክአውት',
  checkoutOneItem: 'ቼክአውት (1 ዕቃ)',
  productNotFound: 'ምርት አልተገኘም',
  cameraAccessTitle: 'የካሜራ ፍቃድ ያስፈልጋል',
  cameraAccessMessage: 'ባርኮዶችን ለመቃኘት የካሜራ ፍቃድ ይስጡ',
  grantPermission: 'ፍቃድ ስጥ',
  productDetails: 'የምርት ዝርዝር',
  addToSale: 'ወደ ሽያጭ ጨምር',
  searchProducts: 'ምርቶችን ፈልግ...',
  noProductsFound: 'ምንም ምርት አልተገኘም',
  noProductsSearchHint: 'ሌላ ፍለጋ ወይም የምድብ ማጣሪያ ይሞክሩ',
  noProductsEmpty: 'ከክምችት የሚመጡ ምርቶች እዚህ ይታያሉ',
  allCategories: 'ሁሉም ምድቦች',
  otherCategory: 'ሌላ',
  uncategorized: 'ያልተመደበ',
  recent: 'የቅርብ ጊዜ',
  filterByCategory: 'በምድብ አጣራ',
  category: 'ምድብ',
  addToCart: 'ወደ ጋሪ ጨምር',
  clearAll: 'ሁሉንም አጽዳ',
  noItemsSelected: 'ምንም ዕቃ አልተመረጠም',
  scanToAdd: 'ዕቃዎችን ለመጨመር ባርኮድ ይቃኙ',
  cartEmpty: 'ጋሪዎ ባዶ ነው',
  cartEmptyHint: 'ዕቃዎችን ለመጨመር ባርኮዶችን ይቃኙ እና ሽያጭ ይጀምሩ',
  recentProducts: 'የቅርብ ጊዜ ምርቶች',
  noRecentTitle: 'እስካሁን የቅርብ ጊዜ ምርት የለም',
  noRecentMessage: 'ከተጠናቀቁ ሽያጮች የሚመጡ ምርቶች ለፈጣን እንደገና ትዕዛዝ እዚህ ይታያሉ።',
  selectVariant: 'ተለዋጭ ይምረጡ',
  selectVariantsHint: 'አንድ ወይም ከዚያ በላይ ተለዋጮችን ይምረጡ',
  inStock: 'በክምችት ውስጥ',
  outOfStock: 'ከክምችት ውጭ',
  clearSelection: 'ምርጫ አጽዳ',
  scanHint: 'ባርኮዱን በፍሬሙ ውስጥ ያስተካክሉ',
  lookingUpProduct: 'ምርት በመፈለግ ላይ...',
  cart: 'ጋሪ',
  productNotFoundMessage: (barcode) => `ምንም ምርት ከባርኮድ ${barcode} ጋር አይዛመድም`,
  checkoutItems: (count) => `ቼክአውት (${count} ዕቃዎች)`,
  selectedItems: (count) => `የተመረጡ ዕቃዎች (${count})`,
  addToCartCount: (count) => `ወደ ጋሪ ጨምር (${count})`,
  addSelected: (count) => `የተመረጡትን ጨምር (${count})`,
};

const om: SellStrings = {
  tabTitle: 'Gurgurtaa',
  backToHome: 'Gara manaatti deebi\'i',
  modes: { keypad: 'Kiipaadii', items: 'Meeshaalee', scan: 'Iskaanii' },
  totalAmount: 'Hangamii Waliigalaa',
  enterServiceName: 'Maqaa Tajaajilaa Galchi',
  quickServices: 'Tajaajiloota Saffisaa',
  noServicesTitle: 'Tajaajilli hin jiru',
  noServicesMessage: 'Kaffaltii kiipaadii fayyadamuuf meeshaalee tajaajilaa dabalaa',
  selectServiceError: 'Maaloo tajaajila filadhu yookaan maqaa tajaajilaa galchi',
  preparingCheckout: 'Kaffaltii qopheessaa jira...',
  checkoutFailed: 'Kaffaltiin hin milkoofne',
  couldNotAddService: 'Tajaajila dabaluu hin dandeenye',
  checkout: 'Kaffaltii',
  checkoutOneItem: 'Kaffaltii (meeshaa 1)',
  productNotFound: 'Oomisha hin argamne',
  cameraAccessTitle: 'Eeyyama Kaameraa Barbaachisa',
  cameraAccessMessage: 'Baarkoodii iskaan gochuuf eeyyama kaameraa kenni',
  grantPermission: 'Eeyyama Kenni',
  productDetails: 'Bal\'ina Oomishaa',
  addToSale: 'Gurgurtaatti Dabaluu',
  searchProducts: 'Oomishaalee barbaadi...',
  noProductsFound: 'Oomishni hin argamne',
  noProductsSearchHint: 'Barbaacha yookaan calaqqee gosa biraa yaali',
  noProductsEmpty: 'Oomishaaleen kuusaa irraa asitti mul\'atu',
  allCategories: 'Gosoota Hunda',
  otherCategory: 'Kan Biroo',
  uncategorized: 'Gosa Hin Kenname',
  recent: 'Dhiyoo',
  filterByCategory: 'Gosa Tiin Calaqqisi',
  category: 'Gosa',
  addToCart: 'Gaariitti Dabaluu',
  clearAll: 'Hunda haquu',
  noItemsSelected: 'Meeshaan hin filatamne',
  scanToAdd: 'Meeshaalee dabaluuf baarkoodii iskaan gochuu',
  cartEmpty: 'Gaariin kee duwwaa dha',
  cartEmptyHint: 'Meeshaalee dabaluuf baarkoodii iskaan gochuun gurgurtaa jalqabi',
  recentProducts: 'Oomishaalee Dhiyoo',
  noRecentTitle: 'Oomishni dhiyoo ammallee hin jiru',
  noRecentMessage:
    'Oomishaaleen gurgurtaa xumurame irraa asitti mul\'atu ajaja saffisaaaf.',
  selectVariant: 'Fooyya\'ii Filadhu',
  selectVariantsHint: 'Fooyya\'ii tokko yookaan isaa ol filadhu',
  inStock: 'Kuusaa keessa',
  outOfStock: 'Kuusaa ala',
  clearSelection: 'Filannoo Haquu',
  scanHint: 'Baarkoodii keessatti qindeessi',
  lookingUpProduct: 'Oomisha barbaadamaa jira...',
  cart: 'Gaarii',
  productNotFoundMessage: (barcode) => `Oomishni baarkoodii ${barcode} wajjin hin walsimu`,
  checkoutItems: (count) => `Kaffaltii (meeshaalee ${count})`,
  selectedItems: (count) => `Meeshaalee Filataman (${count})`,
  addToCartCount: (count) => `Gaariitti Dabaluu (${count})`,
  addSelected: (count) => `Filataman Dabaluu (${count})`,
};

const ti: SellStrings = {
  tabTitle: 'ሽያጭ',
  backToHome: 'ናብ መእተዊ ተመለስ',
  modes: { keypad: 'ኪፓድ', items: 'ንብቲ', scan: 'ስካን' },
  totalAmount: 'ድምር መጠን',
  enterServiceName: 'ስም ኣገልግሎት ኣእትው',
  quickServices: 'ቅልጡፍ ኣገልግሎታት',
  noServicesTitle: 'ኣገልግሎት የለን',
  noServicesMessage: 'ኪፓድ ቼክአውት ንምጥቃም ናይ ኣገልግሎት ዓይነት ንብቲ ወስኹ',
  selectServiceError: 'በጃኹም ኣገልግሎት ምረጹ ወይ ስም ኣገልግሎት ኣእትዉ',
  preparingCheckout: 'ቼክአውት ይዳለይ ኣሎ...',
  checkoutFailed: 'ቼክአውት ኣይተሳኸነን',
  couldNotAddService: 'ኣገልግሎት ክውስኽ ኣይከኣለን',
  checkout: 'ቼክአውት',
  checkoutOneItem: 'ቼክአውት (1 ንብቲ)',
  productNotFound: 'ፍርያት ኣይተረኸበን',
  cameraAccessTitle: 'ፍቓድ ካሜራ የድሊ',
  cameraAccessMessage: 'ባርኮድ ንምስካን ፍቓድ ካሜራ ሃቡ',
  grantPermission: 'ፍቓድ ሃቡ',
  productDetails: 'ዝርዝር ፍርያት',
  addToSale: 'ናብ ሽያጭ ወስኽ',
  searchProducts: 'ፍርያት ድለዩ...',
  noProductsFound: 'ፍርያት ኣይተረኸበን',
  noProductsSearchHint: 'ካልእ ምድላይ ወይ ምድብ ፈትነት ፈትኑ',
  noProductsEmpty: 'ካብ መኽዘን ዝመጹ ፍርያት ኣብዚ ክርአዩ እዮም',
  allCategories: 'ኩሉ ምድባት',
  otherCategory: 'ካልእ',
  uncategorized: 'ዘይተመደበ',
  recent: 'ናይ ቀረባ',
  filterByCategory: 'ብምድብ ኣጣሪ',
  category: 'ምድብ',
  addToCart: 'ናብ ጋሪ ወስኽ',
  clearAll: 'ኩሉ ኣጽሪ',
  noItemsSelected: 'ንብቲ ኣይተመረጸን',
  scanToAdd: 'ንብቲ ንምውሳኽ ባርኮድ ስካን ግበር',
  cartEmpty: 'ጋርይኻ ባዶ እዩ',
  cartEmptyHint: 'ንብቲ ንምውሳኽ ባርኮድ ስካን ግበርን ሽያጭ ጀምር',
  recentProducts: 'ናይ ቀረባ ፍርያት',
  noRecentTitle: 'ክሳብ ሕጂ ናይ ቀረባ ፍርያት የለን',
  noRecentMessage: 'ካብ ዝተዛዘሙ ሽያጣት ዝመጹ ፍርያት ንቅልጡፍ ትዕዛዝ ኣብዚ ክርአዩ እዮም።',
  selectVariant: 'ተለዋጢ ምረጽ',
  selectVariantsHint: 'ሓንቲ ወይ ካብኡ ላዕሊ ተለዋጢታት ምረጽ',
  inStock: 'ኣብ መኽዘን',
  outOfStock: 'ካብ መኽዘን ወጻኢ',
  clearSelection: 'ምርጫ ኣጽሪ',
  scanHint: 'ባርኮድ ኣብ ፍሬም ኣስተኻኽል',
  lookingUpProduct: 'ፍርያት ይድለይ ኣሎ...',
  cart: 'ጋሪ',
  productNotFoundMessage: (barcode) => `ምንም ፍርያት ምስ ባርኮድ ${barcode} ኣይሰማማዕን`,
  checkoutItems: (count) => `ቼክአውት (${count} ንብቲ)`,
  selectedItems: (count) => `ዝተመረጹ ንብቲ (${count})`,
  addToCartCount: (count) => `ናብ ጋሪ ወስኽ (${count})`,
  addSelected: (count) => `ዝተመረጹ ወስኽ (${count})`,
};

const so: SellStrings = {
  tabTitle: 'Iib',
  backToHome: 'Ku noqo guriga',
  modes: { keypad: 'Kiiboodh', items: 'Alaab', scan: 'Iskaan' },
  totalAmount: 'Wadarta Guud',
  enterServiceName: 'Geli Magaca Adeegga',
  quickServices: 'Adeegyo Degdeg ah',
  noServicesTitle: 'Adeegyo ma jiraan',
  noServicesMessage: 'Ku dar alaab nooca adeeg si aad u isticmaasho kiiboodhka',
  selectServiceError: 'Fadlan dooro adeeg ama geli magaca adeegga',
  preparingCheckout: 'Diyaarinta lacag bixinta...',
  checkoutFailed: 'Lacag bixintu way fashilantay',
  couldNotAddService: 'Adeegga lama dari karin',
  checkout: 'Lacag bixin',
  checkoutOneItem: 'Lacag bixin (1 alaab)',
  productNotFound: 'Alaab lama helin',
  cameraAccessTitle: 'Ogolaanshaha Kamarada ayaa loo baahan yahay',
  cameraAccessMessage: 'Ogolow kamarada si aad u iskaankaan barcode-yada',
  grantPermission: 'Sii Ogolaansho',
  productDetails: 'Faahfaahinta Alaabta',
  addToSale: 'Ku dar Iibka',
  searchProducts: 'Raadi alaabta...',
  noProductsFound: 'Alaab lama helin',
  noProductsSearchHint: 'Isku day raadin kale ama shaandhayn qayb',
  noProductsEmpty: 'Alaabta kaydka ka timaadda halkan ayay ka muuqan doontaa',
  allCategories: 'Dhammaan Qaybaha',
  otherCategory: 'Kale',
  uncategorized: 'Aan la qaybin',
  recent: 'Dhawaan',
  filterByCategory: 'Ku shaandhee Qaybta',
  category: 'Qayb',
  addToCart: 'Ku dar Gaadhiga',
  clearAll: 'Nadiifi dhammaan',
  noItemsSelected: 'Wax alaab ah lama dooran',
  scanToAdd: 'Iskaan barcode si aad u darto alaab',
  cartEmpty: 'Gaadhigaagu waa madhan yahay',
  cartEmptyHint: 'Iskaan barcode-yada si aad u darto alaab oo aad iib bilowdo',
  recentProducts: 'Alaab Dhawaan',
  noRecentTitle: 'Weli alaab dhawaan ma jirto',
  noRecentMessage:
    'Alaabta iibka dhammaystay ka timaadda halkan ayay u muuqan doontaa si degdeg ah loo dalbado.',
  selectVariant: 'Dooro Nooca',
  selectVariantsHint: 'Dooro hal ama in ka badan noocyo',
  inStock: 'Kaydka ku jira',
  outOfStock: 'Kaydka ka baxay',
  clearSelection: 'Nadiifi doorashada',
  scanHint: 'Barcode ku habee qaabka',
  lookingUpProduct: 'Raadinaya alaabta...',
  cart: 'Gaadhi',
  productNotFoundMessage: (barcode) => `Alaab barcode ${barcode} kuma habboona`,
  checkoutItems: (count) => `Lacag bixin (${count} alaab)`,
  selectedItems: (count) => `Alaab La Doortay (${count})`,
  addToCartCount: (count) => `Ku dar Gaadhiga (${count})`,
  addSelected: (count) => `Ku dar La Doortay (${count})`,
};

export const SELL_TRANSLATIONS: Record<LanguageId, SellStrings> = {
  en,
  am,
  om,
  ti,
  so,
};

export function getSellStrings(languageId: string): SellStrings {
  return SELL_TRANSLATIONS[resolveLanguageId(languageId)];
}

export function sellCheckoutLabel(strings: SellStrings, count: number): string {
  if (count > 1) return strings.checkoutItems(count);
  if (count === 1) return strings.checkoutOneItem;
  return strings.checkout;
}

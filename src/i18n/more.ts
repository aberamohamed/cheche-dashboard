import { resolveLanguageId, type LanguageId } from '@/data/languages';

export interface MoreStrings {
  tabTitle: string;
  title: string;
  subtitle: string;
  profile: string;
  businessProfile: string;
  items: string;
  manageInventory: string;
  stockReport: string;
  checkStock: string;
  customers: string;
  manageCustomers: string;
  orders: string;
  manageOrders: string;
  invoices: string;
  manageInvoices: string;
  receipts: string;
  manageReceipts: string;
  returns: string;
  manageReturns: string;
  withholding: string;
  settings: string;
  language: string;
  changeLanguage: string;
  notification: string;
  manageNotifications: string;
  about: string;
  aboutApp: string;
  businessName: string;
  businessId: string;
  email: string;
  phone: string;
  location: string;
  timezone: string;
  currency: string;
  logout: string;
  logoutConfirm: string;
  yes: string;
  no: string;
  cancel: string;
  save: string;
  update: string;
  delete: string;
  edit: string;
  add: string;
  version: string;
  supportCenter: string;
  contactUs: string;
  privacyPolicy: string;
  termsOfService: string;
  help: string;
  feedback: string;
  darkMode: string;
  lightMode: string;
  theme: string;
  account: string;
  accountSettings: string;
  dataBackup: string;
  backupData: string;
  clearCache: string;
  appInfo: string;
  legal: string;
  notifications: string;
  enableNotifications: string;
  disableNotifications: string;
  lowStockAlerts: string;
  salesAlerts: string;
  invoiceAlerts: string;
  workOffline: string;
  completeOfflineSales: string;
  manageOfflineItems: string;
  chooseOfflineItems: string;
  unsyncedSales: string;
  offlineSalesReport: string;
  offlineReportHint: string;
  businessSection: string;
  purchaseSection: string;
  promotionsSection: string;
  securitySection: string;
  generalSection: string;
  purchaseOrders: string;
  purchaseInvoices: string;
  purchaseReceipts: string;
  purchaseReturns: string;
  purchaseWithholding: string;
  coupons: string;
  promotions: string;
  giftCards: string;
  permissions: string;
  bluetoothPrinter: string;
  aboutUs: string;
}

const en: MoreStrings = {
  tabTitle: 'More',
  title: 'More',
  subtitle: 'Manage your profile and settings',
  profile: 'Profile',
  businessProfile: 'Business Profile',
  items: 'Items',
  manageInventory: 'Manage Inventory',
  stockReport: 'Stock Report',
  checkStock: 'Check Stock Levels',
  customers: 'Customers',
  manageCustomers: 'Manage Customers',
  orders: 'Orders',
  manageOrders: 'Manage Orders',
  invoices: 'Invoices',
  manageInvoices: 'Manage Invoices',
  receipts: 'Receipts',
  manageReceipts: 'Manage Receipts',
  returns: 'Returns',
  manageReturns: 'Manage Returns',
  withholding: 'Withholding',
  settings: 'Settings',
  language: 'Language',
  changeLanguage: 'Change Language',
  notification: 'Notifications',
  manageNotifications: 'Manage Notifications',
  about: 'About',
  aboutApp: 'About This App',
  businessName: 'Business Name',
  businessId: 'Business ID',
  email: 'Email',
  phone: 'Phone',
  location: 'Location',
  timezone: 'Timezone',
  currency: 'Currency',
  logout: 'Logout',
  logoutConfirm: 'Are you sure you want to logout?',
  yes: 'Yes',
  no: 'No',
  cancel: 'Cancel',
  save: 'Save',
  update: 'Update',
  delete: 'Delete',
  edit: 'Edit',
  add: 'Add',
  version: 'Version',
  supportCenter: 'Support Center',
  contactUs: 'Contact Us',
  privacyPolicy: 'Privacy Policy',
  termsOfService: 'Terms of Service',
  help: 'Help',
  feedback: 'Send Feedback',
  darkMode: 'Dark Mode',
  lightMode: 'Light Mode',
  theme: 'Theme',
  account: 'Account',
  accountSettings: 'Account Settings',
  dataBackup: 'Data Backup',
  backupData: 'Backup My Data',
  clearCache: 'Clear Cache',
  appInfo: 'App Information',
  legal: 'Legal',
  notifications: 'Notifications',
  enableNotifications: 'Enable Notifications',
  disableNotifications: 'Disable Notifications',
  lowStockAlerts: 'Low Stock Alerts',
  salesAlerts: 'Sales Alerts',
  invoiceAlerts: 'Invoice Alerts',
  workOffline: 'Work Offline (Cash Only)',
  completeOfflineSales: 'Complete cash sales without internet and sync later',
  manageOfflineItems: 'Manage Offline Items',
  chooseOfflineItems: 'Choose which items/services show on Sell when offline',
  unsyncedSales: 'Unsynced Sales',
  offlineSalesReport: 'Offline Sales Report',
  offlineReportHint: 'All offline sales with synced status and date filter',
  businessSection: 'Business',
  purchaseSection: 'Purchase',
  promotionsSection: 'Promotions',
  securitySection: 'Security',
  generalSection: 'General',
  purchaseOrders: 'Purchase Orders',
  purchaseInvoices: 'Purchase Invoices',
  purchaseReceipts: 'Purchase Receipts',
  purchaseReturns: 'Purchase Returns',
  purchaseWithholding: 'Purchase Withholding',
  coupons: 'Coupons',
  promotions: 'Promotions',
  giftCards: 'Gift Cards',
  permissions: 'Permissions',
  bluetoothPrinter: 'Bluetooth Printer',
  aboutUs: 'About Us',
};

const am: MoreStrings = {
  tabTitle: 'ተጨማሪ',
  title: 'ተጨማሪ',
  subtitle: 'መገለጫ እና ቅንብሮች ያስተዳድሩ',
  profile: 'መገለጫ',
  businessProfile: 'የንግድ መገለጫ',
  items: 'ዕቃዎች',
  manageInventory: 'ክምችትን ያስተዳድሩ',
  stockReport: 'የክምችት ሪፖርት',
  checkStock: 'ክምችት ደረጃዎችን ይመልከቱ',
  customers: 'ደንበኞች',
  manageCustomers: 'ደንበኞችን ያስተዳድሩ',
  orders: 'ትዕዛዞች',
  manageOrders: 'ትዕዛዞችን ያስተዳድሩ',
  invoices: 'ስሌቶች',
  manageInvoices: 'ስሌቶችን ያስተዳድሩ',
  receipts: 'ደረሰኞች',
  manageReceipts: 'ደረሰኞችን ያስተዳድሩ',
  returns: 'ተመላሾች',
  manageReturns: 'ተመላሾችን ያስተዳድሩ',
  withholding: 'ተያዘ',
  settings: 'ቅንብሮች',
  language: 'ቋንቋ',
  changeLanguage: 'ቋንቋ ይቀይሩ',
  notification: 'ማስታወቂያዎች',
  manageNotifications: 'ማስታወቂያዎችን ያስተዳድሩ',
  about: 'ስለ',
  aboutApp: 'ስለዚህ መተግበሪያ',
  businessName: 'የንግድ ስም',
  businessId: 'የንግድ ID',
  email: 'ኢሜይል',
  phone: 'ስልክ',
  location: 'ቦታ',
  timezone: 'የጊዜ ሰቅ',
  currency: '통화',
  logout: 'ወጣ',
  logoutConfirm: 'ብርታትህ መወጣት ጠብቅ?',
  yes: 'አዎ',
  no: 'አይደለም',
  cancel: 'ይቅር',
  save: 'ቆሙ',
  update: 'ማሻሻል',
  delete: 'ሰርዝ',
  edit: 'ስተካ',
  add: 'ጨምር',
  version: 'ስሪት',
  supportCenter: 'የድጋፍ ማዕከል',
  contactUs: 'ያግኙን',
  privacyPolicy: 'የግላዊነት ፖሊሲ',
  termsOfService: 'የአገልግሎት ሁኔታዎች',
  help: 'እርዳታ',
  feedback: 'አስተያየት ይላኩ',
  darkMode: 'ጨለማ ሁኔታ',
  lightMode: 'ብርሃን ሁኔታ',
  theme: 'ጭብጥ',
  account: 'መለያ',
  accountSettings: 'የመለያ ቅንብሮች',
  dataBackup: 'ውሂብ ምትክ',
  backupData: 'ውሂቤን ፈልሰው ያድሩ',
  clearCache: 'ክፍተቱን ንጽህ',
  appInfo: 'የመተግበሪያ መረጃ',
  legal: 'ህጋዊ',
  notifications: 'ማስታወቂያዎች',
  enableNotifications: 'ማስታወቂያዎችን ያንቁ',
  disableNotifications: 'ማስታወቂያዎችን ያሽግሩ',
  lowStockAlerts: 'ዝቅተኛ ክምችት ማጠንቀቂያዎች',
  salesAlerts: 'የሽያጭ ማጠንቀቂያዎች',
  invoiceAlerts: 'የስሌት ማጠንቀቂያዎች',
  workOffline: 'ከበር ጎደል ሥራ (ጠንካራ ብቻ)',
  completeOfflineSales: 'ከበር ጎደል ጠንካራ ሽያጭ ያጠናቁ እና በኋላ ያመሳስሉ',
  manageOfflineItems: 'ከበር ጎደል ምርቶች ያስተዳድሩ',
  chooseOfflineItems: 'ከበር ጎደል ሆኖ በሽያጭ ላይ የሚታዩትን ምርቶች/አገልግሎቶች ይምረጡ',
  unsyncedSales: 'ያልተመሳሰሉ ሽያጭ',
  offlineSalesReport: 'ከበር ጎደል ሽያጭ ሪፖርት',
  offlineReportHint: 'ሁሉም ከበር ጎደል ሽያጭ ከተመሳሰለ ሁኔታ እና የቀን ማጣሪያ ጋር',
  businessSection: 'ንግድ',
  purchaseSection: 'ግዢ',
  promotionsSection: 'ማስተባበቂያዎች',
  securitySection: 'ደህንነት',
  generalSection: 'አጠቃላይ',
  purchaseOrders: 'ግዢ ትዕዛዞች',
  purchaseInvoices: 'ግዢ ስሌቶች',
  purchaseReceipts: 'ግዢ ደረሰኞች',
  purchaseReturns: 'ግዢ ተመላሾች',
  purchaseWithholding: 'ግዢ ተያዘ',
  coupons: 'ኩፖንች',
  promotions: 'ማስተባበቂያዎች',
  giftCards: 'የስጦታ ካርዶች',
  permissions: 'ፈቃዶች',
  bluetoothPrinter: 'ብሉቱዝ ሞተር',
  aboutUs: 'ስለ እኛ',
};

const om: MoreStrings = {
  tabTitle: 'Dabalataa',
  title: 'Dabalataa',
  subtitle: 'Profaili fi Qindaawwan Bulchuu',
  profile: 'Profaili',
  businessProfile: 'Profaili Giddo-gida',
  items: 'Meeshaalee',
  manageInventory: 'Kuusaa Bulchuu',
  stockReport: 'Gaaffii Kuusaa',
  checkStock: 'Sadarkaa Kuusaa Jiruu Sakatta',
  customers: 'Fayyadamtoonni',
  manageCustomers: 'Fayyadamtoonni Bulchuu',
  orders: 'Tixaannoo',
  manageOrders: 'Tixaannoo Bulchuu',
  invoices: 'Gaaffilee',
  manageInvoices: 'Gaaffilee Bulchuu',
  receipts: 'Heduu-suuqa',
  manageReceipts: 'Heduu-suuqa Bulchuu',
  returns: 'Deebina',
  manageReturns: 'Deebina Bulchuu',
  withholding: 'Wallagaa',
  settings: 'Qindaawwan',
  language: 'Afaan',
  changeLanguage: 'Afaan Jijjiiri',
  notification: 'Ilmaannaa',
  manageNotifications: 'Ilmaannaa Bulchuu',
  about: 'Waa\'aaraa',
  aboutApp: 'Waa\'aaraa Applikeshana Kanaa',
  businessName: 'Maqaa Giddo-gida',
  businessId: 'ID Giddo-gida',
  email: 'Imeelii',
  phone: 'Bilbilaa',
  location: 'Bakka',
  timezone: 'Naannoo Yeroo',
  currency: 'Maallaqa',
  logout: 'Ba\'u',
  logoutConfirm: 'Maal yeroo keessa ba\'uu jetta?',
  yes: 'Eeyyee',
  no: 'Miti',
  cancel: 'Hid',
  save: 'Kuusaa',
  update: 'Haaraa Gochuu',
  delete: 'Balleessuu',
  edit: 'Gumaachuu',
  add: 'Dabaluu',
  version: 'Veershana',
  supportCenter: 'Sadarkaa Deggersaa',
  contactUs: 'Iin Walqabsii',
  privacyPolicy: 'Seera Iccitii',
  termsOfService: 'Jechoonni Tajaajilaa',
  help: 'Gargaarsa',
  feedback: 'Yaada Ergini',
  darkMode: 'Mode Madaa',
  lightMode: 'Mode Ifaa',
  theme: 'Mata\'ii',
  account: 'Heesaara',
  accountSettings: 'Qindaawwan Heesaara',
  dataBackup: 'Jijjii Deetaa',
  backupData: 'Deetaa Koo Jijji',
  clearCache: 'Imaam Salphisu',
  appInfo: 'Odeeffannoo Applikeshana',
  legal: 'Seera',
  notifications: 'Ilmaannaa',
  enableNotifications: 'Ilmaannaa Dandeessii',
  disableNotifications: 'Ilmaannaa Dansuu',
  lowStockAlerts: 'Ilmaannaa Kuusaa Gadi',
  salesAlerts: 'Ilmaannaa Gurgurtaa',
  invoiceAlerts: 'Ilmaannaa Gaafii',
  workOffline: 'Hojii Interneetii Malee (Maallaqa Qofa)',
  completeOfflineSales: 'Gurgurtaa Maallaqa Interneetii Malee gumaachuu fi duma\'a ji\'aa',
  manageOfflineItems: 'Meeshaalee Interneetii Malee Bulchuu',
  chooseOfflineItems: 'Interneetii malee gurgurtaa keessatti mul\'atu meeshaalee/hewwaja filadhu',
  unsyncedSales: 'Gurgurtaa Walqabsiisaan hin taane',
  offlineSalesReport: 'Gaaffii Gurgurtaa Interneetii Malee',
  offlineReportHint: 'Gurgurtaa Interneetii Malee hundinuu haala walqabsiisaa fi gingilcha guyyaa waliin',
  businessSection: 'Giddo-gida',
  purchaseSection: 'Bitaa',
  promotionsSection: 'Dhiibbaa',
  securitySection: 'Nageenya',
  generalSection: 'Amansiisa',
  purchaseOrders: 'Tixaannoo Bitaa',
  purchaseInvoices: 'Gaaffii Bitaa',
  purchaseReceipts: 'Heduu-suuqa Bitaa',
  purchaseReturns: 'Deebina Bitaa',
  purchaseWithholding: 'Wallagaa Bitaa',
  coupons: 'Kuuponii',
  promotions: 'Dhiibbaa',
  giftCards: 'Kaardii Hantaa',
  permissions: 'Witira\'oo',
  bluetoothPrinter: 'Bas\'iisaa Bluetooth',
  aboutUs: 'Waa\'aaraa Keenya',
};

const ti: MoreStrings = {
  tabTitle: 'ተወሳኺ',
  title: 'ተወሳኺ',
  subtitle: 'መገለጫ ከምኡ ምውጫታት ምቅላስ',
  profile: 'መገለጫ',
  businessProfile: 'ናይ ንግዲ መገለጫ',
  items: 'ንብቲ',
  manageInventory: 'ክምችት ኢዳት',
  stockReport: 'ናይ ክምችት ሪፖርት',
  checkStock: 'ናይ ክምችት ደረጃ ምርምር',
  customers: 'ገዛኢ',
  manageCustomers: 'ገዛኢ ኢዳት',
  orders: 'ትእዛዝ',
  manageOrders: 'ትእዛዝ ኢዳት',
  invoices: 'ሰሌዳታት',
  manageInvoices: 'ሰሌዳታት ኢዳት',
  receipts: 'ሽምምዝ',
  manageReceipts: 'ሽምምዝ ኢዳት',
  returns: 'ምልሓት',
  manageReturns: 'ምልሓት ኢዳት',
  withholding: 'ተኸፍሊ',
  settings: 'ምውጫታት',
  language: 'ቋንቋ',
  changeLanguage: 'ቋንቋ ምቅያር',
  notification: 'ማንቂያ',
  manageNotifications: 'ማንቂያ ኢዳት',
  about: 'ስለ',
  aboutApp: 'ስለዚህ መተግበሪያ',
  businessName: 'ስም ንግዲ',
  businessId: 'ID ንግዲ',
  email: 'ኢሜይል',
  phone: 'ስልክ',
  location: 'ቦታ',
  timezone: 'ወለዜ ሰዓት',
  currency: 'ገንዘብ',
  logout: 'ወጻ',
  logoutConfirm: 'ብርታትህ ወጣት ትብል?',
  yes: 'እወ',
  no: 'ኣይኮነን',
  cancel: 'ይከልህ',
  save: 'ኦቭ',
  update: 'ሓድስ ግበር',
  delete: 'ስርዕ',
  edit: 'ኣስተካክል',
  add: 'ወስኽ',
  version: 'ሕትመታ',
  supportCenter: 'ናይ ምስሓት ማእከል',
  contactUs: 'ነናኻ ርከብ',
  privacyPolicy: 'ሚሊሳ ምሕደራ',
  termsOfService: 'ውዑልታት ልምምድ',
  help: 'ምስሓት',
  feedback: 'አረመንዳ ልሳን',
  darkMode: 'ጨለማ ምዕራፍ',
  lightMode: 'ብርሃን ምዕራፍ',
  theme: 'ወርቃን',
  account: 'ሂሳብ',
  accountSettings: 'ናይ ሂሳብ ምውጫታት',
  dataBackup: 'ምልሓት ዝርዝር',
  backupData: 'ዝርዝሬ ምልሓት',
  clearCache: 'ካሽ ዝንቅ',
  appInfo: 'ናይ መተግበሪያ ሓበሬታ',
  legal: 'ህጋዊ',
  notifications: 'ማንቂያ',
  enableNotifications: 'ማንቂያ ብቅዓት',
  disableNotifications: 'ማንቂያ ተዓጺብ',
  lowStockAlerts: 'ናይ ዝቅተኛ ክምችት ማንቂያ',
  salesAlerts: 'ናይ ሽያጭ ማንቂያ',
  invoiceAlerts: 'ናይ ሰሌዳ ማንቂያ',
  workOffline: 'ዩርሃ ሽቀጥ (ብ ገንዘብ ብቁጥር)',
  completeOfflineSales: 'ዩርሃ ሽቀጥ ንስሌተ ገንዘብ ካብ ንሰብ ወጥ ከም ቤት ሳልተ',
  manageOfflineItems: 'ዩርሃ ሽቀጥ ዕቃ ምቅላስ',
  chooseOfflineItems: 'ዩርሃ ሽቀጥ ሕቶ ኣሎካ ዕቃ/ጣቐሳ ምምራሕ',
  unsyncedSales: 'ዋ-ተስሓተወ ሽያጭ',
  offlineSalesReport: 'ዩርሃ ሽቀጥ ሽያጭ ዘገባ',
  offlineReportHint: 'ሁሉም ዩርሃ ሽቀጥ ሽያጭ ከተሓተወ ሁኔታ ጋር ወይም ቀን ሕተታ',
  businessSection: 'ንግዲ',
  purchaseSection: 'ግዥ',
  promotionsSection: 'ምስ ምክንያት',
  securitySection: 'ሜድ',
  generalSection: 'ሓበሬታ',
  purchaseOrders: 'ግዥ ትእዛዝ',
  purchaseInvoices: 'ግዥ ሰሌዳታት',
  purchaseReceipts: 'ግዥ ሽምምዝ',
  purchaseReturns: 'ግዥ ተመላሽ',
  purchaseWithholding: 'ግዥ ተኸፍሊ',
  coupons: 'ኩፖናት',
  promotions: 'ምስ ምክንያት',
  giftCards: 'ናይ ስጦታ ካርድ',
  permissions: 'ሕጋዊ ሰልጣን',
  bluetoothPrinter: 'ብሉቱዝ ፕሪንተር',
  aboutUs: 'ስለነኒ',
};

const so: MoreStrings = {
  tabTitle: 'Badan',
  title: 'Badan',
  subtitle: 'Haliso qofkaaga iyo qaabab-qaabab',
  profile: 'Qofka',
  businessProfile: 'Qofka Ganacsiga',
  items: 'Alaab',
  manageInventory: 'Haliso Kharaji',
  stockReport: 'Garafka Kharaji',
  checkStock: 'Ogaada Sadarkaa Kharaji',
  customers: 'Macaamiisha',
  manageCustomers: 'Haliso Macaamiisha',
  orders: 'Dalabka',
  manageOrders: 'Haliso Dalabka',
  invoices: 'Fariimaha',
  manageInvoices: 'Haliso Fariimaha',
  receipts: 'Rasiidka',
  manageReceipts: 'Haliso Rasiidka',
  returns: 'Celinta',
  manageReturns: 'Haliso Celinta',
  withholding: 'Kaydiva',
  settings: 'Qaabka',
  language: 'Luqada',
  changeLanguage: 'Badal Luqada',
  notification: 'Ogaallada',
  manageNotifications: 'Haliso Ogaallada',
  about: 'Walaaca',
  aboutApp: 'Walaaca App-kan',
  businessName: 'Magaca Ganacsiga',
  businessId: 'ID Ganacsiga',
  email: 'Email',
  phone: 'Teleefon',
  location: 'Meesha',
  timezone: 'Gareega Wakhtiga',
  currency: 'Lacag',
  logout: 'Ka Bax',
  logoutConfirm: 'Xaqiiq ayad rabta inaad ka baxdo?',
  yes: 'Hah',
  no: 'Maya',
  cancel: 'Soo Celis',
  save: 'Kaydhi',
  update: 'Cusboonaysi',
  delete: 'Tirtir',
  edit: 'Wax ka Beddel',
  add: 'Ku Dar',
  version: 'Nuxurka',
  supportCenter: 'Xarunta Caawinta',
  contactUs: 'Nala Soo Xiriir',
  privacyPolicy: 'Qaexida Sirta',
  termsOfService: 'Sharuuc Adeega',
  help: 'Caawin',
  feedback: 'Dir Fiidbaac',
  darkMode: 'Caadiga Madow',
  lightMode: 'Caadiga Ifarta',
  theme: 'Qaab',
  account: 'Koonto',
  accountSettings: 'Qaabka Koonto',
  dataBackup: 'Kaydiga Xogta',
  backupData: 'Kaydi Xogteydii',
  clearCache: 'Nadiifi Cache-ka',
  appInfo: 'Macluumaadka App-ka',
  legal: 'Sharci',
  notifications: 'Ogaallada',
  enableNotifications: 'Fidiiso Ogaallada',
  disableNotifications: 'Dheereeji Ogaallada',
  lowStockAlerts: 'Ogaallada Kharaji Yar',
  salesAlerts: 'Ogaallada Iibka',
  invoiceAlerts: 'Ogaallada Fariimaha',
  workOffline: 'Shaqo Offline (Lacagta Kaliya)',
  completeOfflineSales: 'Kompleetee iibka lacag bila internet oo akhariso dib',
  manageOfflineItems: 'Halkamee Walxaha Offline',
  chooseOfflineItems: 'Xaadis walxaha / adeegyada ay muuqan doonaan ee iibka marka offline',
  unsyncedSales: 'Iibka aan la Isku Raastamanayn',
  offlineSalesReport: 'Warqadda Iibka Offline',
  offlineReportHint: 'Dhammaan iibka offline oo leh xaaladda isku raastamay iyo sifi taariikhda',
  businessSection: 'Ganacsiga',
  purchaseSection: 'Kiisa',
  promotionsSection: 'Abaalmarinta',
  securitySection: 'Ammaanta',
  generalSection: 'Ama\'aama',
  purchaseOrders: 'Dalabka Kiisa',
  purchaseInvoices: 'Fariimaha Kiisa',
  purchaseReceipts: 'Rasiidka Kiisa',
  purchaseReturns: 'Celinta Kiisa',
  purchaseWithholding: 'Kaydiva Kiisa',
  coupons: 'Kuupoonnada',
  promotions: 'Abaalmarinta',
  giftCards: 'Kaardaha Hadiyada',
  permissions: 'Xuquuqda',
  bluetoothPrinter: 'Printerka Bluetooth',
  aboutUs: 'Ina Saabta',
};

export function getMoreStrings(language: string): MoreStrings {
  const langId = resolveLanguageId(language);
  const strings: Record<LanguageId, MoreStrings> = { en, am, om, ti, so };
  return strings[langId] || en;
}

import { resolveLanguageId, type LanguageId } from '@/data/languages';

export interface InvoiceStrings {
  tabTitle: string;
  title: string;
  subtitle: string;
  invoices: string;
  cre: string;
  dbe: string;
  receipts: string;
  searchPlaceholder: string;
  filterButton: string;
  noInvoicesTitle: string;
  noInvoicesMessage: string;
  noReceiptsTitle: string;
  noReceiptsMessage: string;
  allStatus: string;
  completed: string;
  pending: string;
  cancelled: string;
  dateRange: string;
  today: string;
  yesterday: string;
  thisWeek: string;
  thisMonth: string;
  reset: string;
  applyFilters: string;
  status: string;
  eimsStatus: string;
  allEimsStatus: string;
  success: string;
  failed: string;
  invoiceDetail: string;
  invoiceNumber: string;
  amount: string;
  date: string;
  supplier: string;
  time: string;
  reference: string;
  notes: string;
  client: string;
  type: string;
  invoice: string;
  paid: string;
  invoiceInformation: string;
  transactionType: string;
  orderNumber: string;
  sellerTin: string;
  buyerTin: string;
  documentNumber: string;
  eirmsAckDate: string;
  items: string;
  lineItems: string;
  filters: string;
  grandTotal: string;
  warehouse: string;
  invoiceDate: string;
  created: string;
  updated: string;
  purchaseOrder: string;
  invoiceIrn: string;
  summary: string;
  totalQty: string;
  subtotal: string;
  taxes: string;
  discount: string;
  paidAmount: string;
  outstanding: string;
  remarks: string;
  copyInvoiceNumber: string;
  viewLineItems: string;
  viewInvoice: string;
  invoiceNotFound: string;
  itemDiscount: string;
}

const en: InvoiceStrings = {
  tabTitle: 'Invoicing',
  title: 'Invoicing',
  subtitle: 'Manage your invoices',
  invoices: 'Invoices',
  cre: 'CRE',
  dbe: 'DBE',
  receipts: 'Receipts',
  searchPlaceholder: 'Search by invoice # or supplier...',
  filterButton: 'Filter',
  noInvoicesTitle: 'No Purchase Invoices',
  noInvoicesMessage: 'Purchase invoices from suppliers will appear here',
  noReceiptsTitle: 'No Receipts',
  noReceiptsMessage: 'Your receipts will appear here',
  allStatus: 'All Status',
  completed: 'Completed',
  pending: 'Pending',
  cancelled: 'Cancelled',
  dateRange: 'Date Range',
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This Week',
  thisMonth: 'This Month',
  reset: 'Reset',
  applyFilters: 'Apply Filters',
  status: 'Status',
  eimsStatus: 'EIMS Status',
  allEimsStatus: 'All EIMS Status',
  success: 'Success',
  failed: 'Failed',
  invoiceDetail: 'Invoice Detail',
  invoiceNumber: 'Invoice Number',
  amount: 'Amount',
  date: 'Date',
  supplier: 'Supplier',
  time: 'Time',
  reference: 'Reference Number',
  notes: 'Notes',
  client: 'Client',
  type: 'Type',
  invoice: 'INVOICE',
  paid: 'PAID',
  invoiceInformation: 'INVOICE INFORMATION',
  transactionType: 'Transaction Type',
  orderNumber: 'Order Number',
  sellerTin: 'Seller TIN',
  buyerTin: 'Buyer TIN',
  documentNumber: 'Document Number',
  eirmsAckDate: 'EIRMS Ack Date',
  items: 'Items',
  lineItems: 'Line Items',
  filters: 'Filters',
  grandTotal: 'Grand Total',
  warehouse: 'Warehouse',
  invoiceDate: 'Invoice Date',
  created: 'Created',
  updated: 'Updated',
  purchaseOrder: 'Purchase Order',
  invoiceIrn: 'Invoice IRN',
  summary: 'Summary',
  totalQty: 'Total Qty',
  subtotal: 'Subtotal',
  taxes: 'Taxes',
  discount: 'Discount',
  paidAmount: 'Paid Amount',
  outstanding: 'Outstanding',
  remarks: 'Remarks',
  copyInvoiceNumber: 'Copy Invoice Number',
  viewLineItems: 'View Line Items',
  viewInvoice: 'View Invoice',
  invoiceNotFound: 'Invoice not found',
  itemDiscount: 'Discount',
};

const am: InvoiceStrings = {
  tabTitle: 'ስሌት',
  title: 'ስሌት',
  subtitle: 'ስሌቶችዎን ይቆጣጠሩ',
  invoices: 'ስሌቶች',
  cre: 'ስሌት',
  dbe: 'ዲቢኢ',
  receipts: 'ደረሰኞች',
  searchPlaceholder: 'በስሌት ቁጥር ወይም አቅራቢ ፈልግ...',
  filterButton: 'ማጣሪያ',
  noInvoicesTitle: 'ምንም ስሌት የለም',
  noInvoicesMessage: 'ከአቅራቢዎች የሚመጡ ስሌቶች እዚህ ይታያሉ',
  noReceiptsTitle: 'ምንም ደረሰኞች የለም',
  noReceiptsMessage: 'ደረሰኞችዎ እዚህ ይታያሉ',
  allStatus: 'ሁሉም ሁኔታ',
  completed: 'ተጠናቅቋል',
  pending: 'በመጠባበቅ ላይ',
  cancelled: 'ተሰርዟል',
  dateRange: 'የቀን ክልል',
  today: 'ዛሬ',
  yesterday: 'ትናንት',
  thisWeek: 'ይህ ሳምንት',
  thisMonth: 'ይህ ወር',
  reset: 'እንደገና ያስጀምሩ',
  applyFilters: 'ማጣሪያዎችን ይተግብሩ',
  status: 'ሁኔታ',
  eimsStatus: 'ኢማስ ሁኔታ',
  allEimsStatus: 'ሁሉም ኢማስ ሁኔታ',
  success: 'ስኬት',
  failed: 'ሳቀ',
  invoiceDetail: 'የስሌት ዝርዝር',
  invoiceNumber: 'ስሌት ቁጥር',
  amount: 'መጠን',
  date: 'ቀን',
  supplier: 'አቅራቢ',
  time: 'ጊዜ',
  reference: 'ማመሳከሪያ ቁጥር',
  notes: 'ማስታወሻዎች',
  client: 'ደንበኛ',
  type: 'ዓይነት',
  invoice: 'ስሌት',
  paid: 'ተከፍሎ',
  invoiceInformation: 'የስሌት መረጃ',
  transactionType: 'የሥራ ዓይነት',
  orderNumber: 'ትዕዛዝ ቁጥር',
  sellerTin: 'ሻጩ TIN',
  buyerTin: 'ገዢ TIN',
  documentNumber: 'ሰነድ ቁጥር',
  eirmsAckDate: 'ኢማስ Ack ቀን',
  items: 'ዕቃዎች',
  lineItems: 'ሊነ ዕቃ',
  filters: 'ማጣሪያዎች',
  grandTotal: 'ጠቅላላ ድምር',
  warehouse: 'ሸፈት',
  invoiceDate: 'የስሌት ቀን',
  created: 'ተፈጥሮ',
  updated: 'ታሪካዊ',
  purchaseOrder: 'የገዢ ትዕዛዝ',
  invoiceIrn: 'ስሌት IRN',
  summary: 'ማጠቃለያ',
  totalQty: 'ጠቅላላ ብዛት',
  subtotal: 'ንዑስ ድምር',
  taxes: 'ግብሮች',
  discount: 'ቅናሽ',
  paidAmount: 'የከፈለ መጠን',
  outstanding: 'ያልተከፈለ',
  remarks: 'አስተያየቶች',
  copyInvoiceNumber: 'የስሌት ቁጥር ቅዳ',
  viewLineItems: 'ስሌት ዕቃዎች ይመልከቱ',
  viewInvoice: 'ስሌት ይመልከቱ',
  invoiceNotFound: 'ስሌት ተገኘ ኣልሆነም',
  itemDiscount: 'ቅናሽ',
};

const om: InvoiceStrings = {
  tabTitle: 'Gaafii',
  title: 'Gaafii',
  subtitle: 'Gaaffii keessan bulchiisi',
  invoices: 'Gaaffilee',
  cre: 'Gaafii',
  dbe: 'DBE',
  receipts: 'Heduu-suuqa',
  searchPlaceholder: 'Lakkoobsa gaafii ykn karaa barbaadi...',
  filterButton: 'Calaqqisi',
  noInvoicesTitle: 'Gaaffii hin jiru',
  noInvoicesMessage: 'Gaaffilee karaa irraa as mul\'atu',
  noReceiptsTitle: 'Heduu-suuqa hin jiru',
  noReceiptsMessage: 'Heduu-suuqaan keessan as mul\'atu',
  allStatus: 'Haalawwan Hunda',
  completed: 'Xumurame',
  pending: 'Eegamaa jira',
  cancelled: 'Hquu\'e',
  dateRange: 'Hammam Guyyaa',
  today: 'Guyyaa Kana',
  yesterday: 'Kaleessa',
  thisWeek: 'Wiikii Kana',
  thisMonth: 'Ji\'a Kana',
  reset: 'Irra deebi\'i',
  applyFilters: 'Calaqqisuuwwan Haa\'i',
  status: 'Haal',
  eimsStatus: 'Haal EIMS',
  allEimsStatus: 'Haalawwan EIMS Hunda',
  success: 'Milkoofne',
  failed: 'Hin Milkoofne',
  invoiceDetail: 'Bal\'ina Gaafii',
  invoiceNumber: 'Lakkoobsa Gaafii',
  amount: 'Hammam',
  date: 'Guyyaa',
  supplier: 'Karaa',
  time: 'Yeroo',
  reference: 'Lakkoobsa Ittiin Yaadatamu',
  notes: 'Yaadadoo',
  client: 'Fayyadamaa',
  type: 'Gosa',
  invoice: 'GAAFII',
  paid: 'KUUFAME',
  invoiceInformation: 'ODEEFFANNOO GAAFII',
  transactionType: 'Gosa Yaalaa',
  orderNumber: 'Lakkoobsa Tixaannoo',
  sellerTin: 'TIN Gurgurtaa',
  buyerTin: 'TIN Bitaa',
  documentNumber: 'Lakkoobsa Dukumantaa',
  eirmsAckDate: 'Guyyaa Ackii EIMS',
  items: 'Meeshaalee',
  lineItems: 'Meeshaalee Sarara',
  filters: 'Calaqqisuuwwan',
  grandTotal: 'Walxaxaa Guddaa',
  warehouse: 'Kuusaa',
  invoiceDate: 'Guyyaa Gaafii',
  created: 'Uumame',
  updated: 'Haaroofsame',
  purchaseOrder: 'Gaafii Bitaa',
  invoiceIrn: 'Gaafii IRN',
  summary: 'Ringiro',
  totalQty: 'Lakkoobsa Waliigalaa',
  subtotal: 'Subtotal',
  taxes: 'Karoora',
  discount: 'Garagalcha',
  paidAmount: 'Hammam Kuufame',
  outstanding: 'Kan Hafe',
  remarks: 'Yaadadoo',
  copyInvoiceNumber: 'Lakkoobsa Gaafii Garagal',
  viewLineItems: 'Meeshaalee Gaafii Ilaali',
  viewInvoice: 'Gaafii Ilaali',
  invoiceNotFound: 'Gaaffii hin argamne',
  itemDiscount: 'Garagalcha',
};

const ti: InvoiceStrings = {
  tabTitle: 'ሰሌዳ',
  title: 'ሰሌዳ',
  subtitle: 'ሰሌዳታትክን ምቁጣጠር',
  invoices: 'ሰሌዳታት',
  cre: 'ሰሌዳ',
  dbe: 'DBE',
  receipts: 'ሽምምዝ',
  searchPlaceholder: 'ብቁጽሪ ሰሌዳ ወይ ነጋዴ ድለ...',
  filterButton: 'ጽንቅሳቕ',
  noInvoicesTitle: 'ሰሌዳ የለን',
  noInvoicesMessage: 'ካብ ነጋዴታት ዝመጹ ሰሌዳታት ኣብዚ ክርአዩ እዮም',
  noReceiptsTitle: 'ሽምምዝ የለን',
  noReceiptsMessage: 'ሽምምዝክን ኣብዚ ክርአዩ እዮም',
  allStatus: 'ሓሙሙ ሁኔታ',
  completed: 'ተዛዚሙ',
  pending: 'ኣብ ግዕዝ ምርጫ ዘሎ',
  cancelled: 'ተሓጺበ',
  dateRange: 'ወሰን መዓልታት',
  today: 'ሎሚ',
  yesterday: 'ጸሊም',
  thisWeek: 'ዚህ ሳምንታት',
  thisMonth: 'ዚህ ወርሒ',
  reset: 'ፈለና ሓድስ',
  applyFilters: 'ጽንቅሳቕ ግበር',
  status: 'ሁኔታ',
  eimsStatus: 'EIMS ሁኔታ',
  allEimsStatus: 'ሓሙሙ EIMS ሁኔታ',
  success: 'ተኣክበ',
  failed: 'ኣይተኣክበን',
  invoiceDetail: 'ዝርዝር ሰሌዳ',
  invoiceNumber: 'ቁጽሪ ሰሌዳ',
  amount: 'መጠን',
  date: 'መዓልታ',
  supplier: 'ነጋዴ',
  time: 'ሰዓት',
  reference: 'ቁጽሪ ሪፈረንስ',
  notes: 'ማስታወሻ',
  client: 'ገዛኢ',
  type: 'ዓይነት',
  invoice: 'ሰሌዳ',
  paid: 'ከፈለ',
  invoiceInformation: 'ሓበሬታ ሰሌዳ',
  transactionType: 'ዓይነት ግብርታት',
  orderNumber: 'ቁጽሪ ትእዛዝ',
  sellerTin: 'TIN ዝሸይጥ',
  buyerTin: 'TIN ተኣሪ',
  documentNumber: 'ቁጽሪ ሰነድ',
  eirmsAckDate: 'ቅንያት EIMS',
  items: 'ውሑዞች',
  lineItems: 'ውሑዞች መስመር',
  filters: 'ጽንቅሳቕ',
  grandTotal: 'ድምር ውጤት',
  warehouse: 'ቅዳዊ',
  invoiceDate: 'ቀን ሰሌዳ',
  created: 'ተፈጠረ',
  updated: 'ተሓሳስበ',
  purchaseOrder: 'ትእዛዝ ዕዳ',
  invoiceIrn: 'ሰሌዳ IRN',
  summary: 'ብቅርቅር',
  totalQty: 'ድምር ብዛት',
  subtotal: 'ንዑስ ድምር',
  taxes: 'ግብር',
  discount: 'ወነስ',
  paidAmount: 'መጠን ተከፋይ',
  outstanding: 'ዘይከፈለ',
  remarks: 'ማስተዋወቂያ',
  copyInvoiceNumber: 'ቁጽሪ ሰሌዳ ቅዳ',
  viewLineItems: 'ውሑዞች ሰሌዳ ርእ',
  viewInvoice: 'ሰሌዳ ርእ',
  invoiceNotFound: 'ሰሌዳ ተረከበ ኣልሕምል',
  itemDiscount: 'ወነስ',
};

const so: InvoiceStrings = {
  tabTitle: 'Fariin Ku Taalo',
  title: 'Fariin Ku Taalo',
  subtitle: 'Isku haysi fariimahakaa',
  invoices: 'Fariimaha',
  cre: 'Fariimaha',
  dbe: 'DBE',
  receipts: 'Rasiidka',
  searchPlaceholder: 'Barbar ku oodhaysi lambar fariimaha ama ergada...',
  filterButton: 'Sifi',
  noInvoicesTitle: 'Fariimaha ma jiraan',
  noInvoicesMessage: 'Fariimaha laga keenay ergi waxay halkan ku muuqdaan',
  noReceiptsTitle: 'Rasiidka ma jiraan',
  noReceiptsMessage: 'Rasiidkagaa waxay halkan ku muuqdaan',
  allStatus: 'Oo Dhan Xaalka',
  completed: 'Gacmeed',
  pending: 'Sugaya',
  cancelled: 'Lagu Joojiyay',
  dateRange: 'Jadwaal Taariikhda',
  today: 'Maanta',
  yesterday: 'Jir',
  thisWeek: 'Usbuucan',
  thisMonth: 'Bishan',
  reset: 'Dib u Eeg',
  applyFilters: 'Tol Sifiya',
  status: 'Xaalka',
  eimsStatus: 'Xaalka EIMS',
  allEimsStatus: 'Oo Dhan Xaalka EIMS',
  success: 'Guul',
  failed: 'Guul ma jiraan',
  invoiceDetail: 'Farriin Fariimaha',
  invoiceNumber: 'Lambar Fariimaha',
  amount: 'Miiska',
  date: 'Taarikh',
  supplier: 'Ergada',
  time: 'Waqti',
  reference: 'Lambar Tixgelin',
  notes: 'Xusuusta',
  client: 'Alaab',
  type: 'Nooca',
  invoice: 'FARIIMAHA',
  paid: 'BIXIYEY',
  invoiceInformation: 'MACLUUMAADKA FARIIMAHA',
  transactionType: 'Nooca Galmada',
  orderNumber: 'Lambar Dalabka',
  sellerTin: 'TIN Iibiyaha',
  buyerTin: 'TIN Shatiga',
  documentNumber: 'Lambar Dukumaenta',
  eirmsAckDate: 'Taarikh EIMS Ack',
  items: 'Walxaha',
  lineItems: 'Walxaha Sarara',
  filters: 'Sifiya',
  grandTotal: 'Oo Dhan Miiska',
  warehouse: 'Guddi',
  invoiceDate: 'Taarikh Fariimaha',
  created: 'Abuuray',
  updated: 'Cusboonaysiiyey',
  purchaseOrder: 'Amarka Gadashada',
  invoiceIrn: 'Fariimaha IRN',
  summary: 'Suurogal',
  totalQty: 'Oo Dhan Tirada',
  subtotal: 'Midka Miiska',
  taxes: 'Canshuuraha',
  discount: 'Hoos u dhac',
  paidAmount: 'Miiska Bixiyay',
  outstanding: 'Sii Jirta',
  remarks: 'Tixraarta',
  copyInvoiceNumber: 'Lambar Fariimaha Nuqul',
  viewLineItems: 'Walxaha Fariimaha Fiiri',
  viewInvoice: 'Fariimaha Fiiri',
  invoiceNotFound: 'Fariimaha la helin mayo',
  itemDiscount: 'Hoos u dhac',
};

export function getInvoiceStrings(language: string): InvoiceStrings {
  const langId = resolveLanguageId(language);
  const strings: Record<LanguageId, InvoiceStrings> = { en, am, om, ti, so };
  return strings[langId] || en;
}

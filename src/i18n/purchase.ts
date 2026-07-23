import { resolveLanguageId, type LanguageId } from '@/data/languages';

export interface PurchaseStrings {
  purchaseInvoices: string;
  invoiceSearchPlaceholder: string;
  noPurchaseInvoicesTitle: string;
  noPurchaseInvoicesMessage: string;
  purchaseReceipts: string;
  receiptSearchPlaceholder: string;
  noPurchaseReceiptsTitle: string;
  noPurchaseReceiptsMessage: string;
  purchaseReturns: string;
  returnSearchPlaceholder: string;
  noPurchaseReturnsTitle: string;
  noPurchaseReturnsMessage: string;
  noSearchResults: string;
  total: string;
  completed: string;
  partial: string;
  pending: string;
  paidAmount: string;
  totalOutstanding: string;
  summary: string;
  filters: string;
}

const en: PurchaseStrings = {
  purchaseInvoices: 'Purchase Invoices',
  invoiceSearchPlaceholder: 'Search by invoice # or supplier...',
  noPurchaseInvoicesTitle: 'No Purchase Invoices',
  noPurchaseInvoicesMessage: 'Purchase invoices from suppliers will appear here',
  purchaseReceipts: 'Purchase Receipts',
  receiptSearchPlaceholder: 'Search by receipt # or supplier...',
  noPurchaseReceiptsTitle: 'No Purchase Receipts',
  noPurchaseReceiptsMessage: 'Purchase receipts from suppliers will appear here',
  purchaseReturns: 'Purchase Returns',
  returnSearchPlaceholder: 'Search by return # or supplier...',
  noPurchaseReturnsTitle: 'No Purchase Returns',
  noPurchaseReturnsMessage: 'Purchase returns to suppliers will appear here',
  noSearchResults: 'No records match your search or filters',
  total: 'Total',
  completed: 'Completed',
  partial: 'Partial',
  pending: 'Pending',
  paidAmount: 'Paid Amount',
  totalOutstanding: 'Total Outstanding',
  summary: 'Summary',
  filters: 'Filters',
};

const am: PurchaseStrings = {
  purchaseInvoices: 'የገዢ ስሌቶች',
  invoiceSearchPlaceholder: 'በስሌት ቁጥር ወይም አቅራቢ ፈልግ...',
  noPurchaseInvoicesTitle: 'ምንም የገዢ ስሌቶች የለም',
  noPurchaseInvoicesMessage: 'ከአቅራቢዎች የሚመጡ ስሌቶች እዚህ ይታያሉ',
  purchaseReceipts: 'የገዢ ደረሰኞች',
  receiptSearchPlaceholder: 'በደረሰታ ቁጥር ወይም አቅራቢ ፈልግ...',
  noPurchaseReceiptsTitle: 'ምንም የገዢ ደረሰኞች የለም',
  noPurchaseReceiptsMessage: 'ከአቅራቢዎች የሚመጡ ደረሰኞች እዚህ ይታያሉ',
  purchaseReturns: 'የገዢ መመለሻዎች',
  returnSearchPlaceholder: 'በመመለሻ ቁጥር ወይም አቅራቢ ፈልግ...',
  noPurchaseReturnsTitle: 'ምንም የገዢ መመለሻዎች የለም',
  noPurchaseReturnsMessage: 'ወደ አቅራቢዎች መመለሻዎች እዚህ ይታያሉ',
  noSearchResults: 'ምንም መዝገቦች የምርምር ወይም ማጣሪያ ጋር አይዛመዱም',
  total: 'ጠቅላላ',
  completed: 'ተጠናቅቋል',
  partial: 'ከፊል',
  pending: 'በመጠባበቅ ላይ',
  paidAmount: 'የከፈለ መጠን',
  totalOutstanding: 'ጠቅላላ ያልተከፈለ',
  summary: 'ማጠቃለያ',
  filters: 'ማጣሪያዎች',
};

const om: PurchaseStrings = {
  purchaseInvoices: 'Gaaffilee Bitaa',
  invoiceSearchPlaceholder: 'Lakkoobsa gaafii ykn karaa barbaadi...',
  noPurchaseInvoicesTitle: 'Gaaffii bitaa hin jiru',
  noPurchaseInvoicesMessage: 'Gaaffilee karaa irraa as mul\'atu',
  purchaseReceipts: 'Rasiidka Bitaa',
  receiptSearchPlaceholder: 'Lakkoobsa rasiidka ykn karaa barbaadi...',
  noPurchaseReceiptsTitle: 'Rasiidka bitaa hin jiru',
  noPurchaseReceiptsMessage: 'Rasiidka karaa irraa as mul\'atu',
  purchaseReturns: 'Deebisa Bitaa',
  returnSearchPlaceholder: 'Lakkoobsa deebisa ykn karaa barbaadi...',
  noPurchaseReturnsTitle: 'Deebisa bitaa hin jiru',
  noPurchaseReturnsMessage: 'Deebisa karaa as mul\'atu',
  noSearchResults: 'Qophiin hin mul\'atu barbaarsa ykn calaqqisuuwwan keenyaaf',
  total: 'Walxaxaa',
  completed: 'Xumurame',
  partial: 'Kutaa',
  pending: 'Eegamaa jira',
  paidAmount: 'Hammam Kuufame',
  totalOutstanding: 'Walxaxaa Kan Hafe',
  summary: 'Ringiro',
  filters: 'Calaqqisuuwwan',
};

const ti: PurchaseStrings = {
  purchaseInvoices: 'ሰሌዳታት ዝተገዘዋ',
  invoiceSearchPlaceholder: 'ብቁጽሪ ሰሌዳ ወይ ነጋዴ ድለ...',
  noPurchaseInvoicesTitle: 'ዝተገዘ ሰሌዳ የለን',
  noPurchaseInvoicesMessage: 'ካብ ነጋዴታት ዝመጹ ሰሌዳታት ኣብዚ ክርአዩ እዮም',
  purchaseReceipts: 'ሽምምዝ ዝተገዘ',
  receiptSearchPlaceholder: 'ብቁጽሪ ሽምምዝ ወይ ነጋዴ ድለ...',
  noPurchaseReceiptsTitle: 'ዝተገዘ ሽምምዝ የለን',
  noPurchaseReceiptsMessage: 'ካብ ነጋዴታት ዝመጹ ሽምምዝ ኣብዚ ክርአዩ እዮም',
  purchaseReturns: 'ምልሪ ዝተገዘ',
  returnSearchPlaceholder: 'ብቁጽሪ ምልሪ ወይ ነጋዴ ድለ...',
  noPurchaseReturnsTitle: 'ዝተገዘ ምልሪ የለን',
  noPurchaseReturnsMessage: 'ወደ ነጋዴታት ምልሪ ኣብዚ ክርአዩ እዮም',
  noSearchResults: 'ሓደ ቖፍ ምርምር ወይ ጽንቅሳቕ ኣይዛመደን',
  total: 'ድምር ውጤት',
  completed: 'ተዛዚሙ',
  partial: 'ሩብ',
  pending: 'ኣብ ግዕዝ ምርጫ ዘሎ',
  paidAmount: 'መጠን ተከፋይ',
  totalOutstanding: 'ድምር ዘይከፈለ',
  summary: 'ብቅርቅር',
  filters: 'ጽንቅሳቕ',
};

const so: PurchaseStrings = {
  purchaseInvoices: 'Fariimaha Gadashada',
  invoiceSearchPlaceholder: 'Barbar ku oodhaysi lambar fariimaha ama ergada...',
  noPurchaseInvoicesTitle: 'Fariimaha gadashada ma jiraan',
  noPurchaseInvoicesMessage: 'Fariimaha laga keenay ergi waxay halkan ku muuqdaan',
  purchaseReceipts: 'Rasiidka Gadashada',
  receiptSearchPlaceholder: 'Barbar ku oodhaysi lambar rasiidka ama ergada...',
  noPurchaseReceiptsTitle: 'Rasiidka gadashada ma jiraan',
  noPurchaseReceiptsMessage: 'Rasiidka laga keenay ergi waxay halkan ku muuqdaan',
  purchaseReturns: 'Celinta Gadashada',
  returnSearchPlaceholder: 'Barbar ku oodhaysi lambar celinta ama ergada...',
  noPurchaseReturnsTitle: 'Celinta gadashada ma jiraan',
  noPurchaseReturnsMessage: 'Celinta ergi waxay halkan ku muuqdaan',
  noSearchResults: 'Wax lagu heli karo ama sixisa ma jiraan',
  total: 'Oo Dhan Miiska',
  completed: 'Gacmeed',
  partial: 'Qaybta',
  pending: 'Sugaya',
  paidAmount: 'Miiska Bixiyay',
  totalOutstanding: 'Oo Dhan Sii Jirta',
  summary: 'Suurogal',
  filters: 'Sifiya',
};

export function getPurchaseStrings(language: string): PurchaseStrings {
  const langId = resolveLanguageId(language);
  const strings: Record<LanguageId, PurchaseStrings> = { en, am, om, ti, so };
  return strings[langId] || en;
}

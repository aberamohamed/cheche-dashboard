import { resolveLanguageId, type LanguageId } from '@/data/languages';

export interface WithholdingStrings {
  tabTitle: string;
  title: string;
  manageWithholding: string;
  withheldAmount: string;
  vatWithheld: string;
  count: string;
  searchPlaceholder: string;
  filterButton: string;
  noWithholdingTitle: string;
  noWithholdingMessage: string;
  analytics: string;
  totalWithheld: string;
  taxWithheld: string;
  vatWithheld: string;
  customRange: string;
  from: string;
  to: string;
  reset: string;
  applyFilters: string;
  status: string;
  allStatus: string;
  completed: string;
  pending: string;
  cancelled: string;
  filterTitle: string;
  dateRange: string;
  today: string;
  yesterday: string;
  thisWeek: string;
  thisMonth: string;
  receipt: string;
  invoice: string;
  detail: string;
  amount: string;
  date: string;
  time: string;
  supplier: string;
  customer: string;
  type: string;
  reference: string;
  notes: string;
  overview: string;
  summary: string;
  transactionCount: string;
  totalAmount: string;
}

const en: WithholdingStrings = {
  tabTitle: 'Withholding',
  title: 'Withholding',
  manageWithholding: 'Manage withholding receipts',
  withheldAmount: 'Withheld Amount',
  vatWithheld: 'VAT Withheld',
  count: 'Count',
  searchPlaceholder: 'Search by receipt #, counter, or II...',
  filterButton: 'Filter',
  noWithholdingTitle: 'No Withholding Receipts',
  noWithholdingMessage: 'Withholding receipts will appear here',
  analytics: 'Analytics',
  totalWithheld: 'Total Withheld',
  taxWithheld: 'Tax Withheld',
  vatWithheld: 'VAT Withheld',
  customRange: 'Custom Range',
  from: 'From',
  to: 'To',
  reset: 'Reset',
  applyFilters: 'Apply Filters',
  status: 'Status',
  allStatus: 'All Status',
  completed: 'Completed',
  pending: 'Pending',
  cancelled: 'Cancelled',
  filterTitle: 'Withholding Filters',
  dateRange: 'Date Range',
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This Week',
  thisMonth: 'This Month',
  receipt: 'Receipt',
  invoice: 'Invoice',
  detail: 'Detail',
  amount: 'Amount',
  date: 'Date',
  time: 'Time',
  supplier: 'Supplier',
  customer: 'Customer',
  type: 'Type',
  reference: 'Reference Number',
  notes: 'Notes',
  overview: 'Overview',
  summary: 'Summary',
  transactionCount: 'Transaction Count',
  totalAmount: 'Total Amount',
};

const am: WithholdingStrings = {
  tabTitle: 'ተያዘ',
  title: 'ተያዘ',
  manageWithholding: 'የተያዘ ደረሰኞችን ያስተዳድሩ',
  withheldAmount: 'የተያዘ መጠን',
  vatWithheld: 'የተያዘ ቨ.ኤ.ቲ',
  count: 'ቁጥር',
  searchPlaceholder: 'በደረሰኛ #፣ ቆጣሪ ወይም II ፈልግ...',
  filterButton: 'ማጣሪያ',
  noWithholdingTitle: 'ምንም የተያዘ ደረሰኛ የለም',
  noWithholdingMessage: 'የተያዘ ደረሰኞች እዚህ ይታያሉ',
  analytics: 'ትንታኔዎች',
  totalWithheld: 'ጠቅላላ ተያዝቷል',
  taxWithheld: 'የተያዘ ታክስ',
  vatWithheld: 'የተያዘ ቨ.ኤ.ቲ',
  customRange: 'ሙሉ ክልል',
  from: 'ከ',
  to: 'እስከ',
  reset: 'እንደገና ያስጀምሩ',
  applyFilters: 'ማጣሪያዎችን ይተግብሩ',
  status: 'ሁኔታ',
  allStatus: 'ሁሉም ሁኔታ',
  completed: 'ተጠናቅቋል',
  pending: 'በመጠባበቅ ላይ',
  cancelled: 'ተሰርዟል',
  filterTitle: 'የተያዘ ማጣሪያዎች',
  dateRange: 'የቀን ክልል',
  today: 'ዛሬ',
  yesterday: 'ትናንት',
  thisWeek: 'ይህ ሳምንት',
  thisMonth: 'ይህ ወር',
  receipt: 'ደረሰኛ',
  invoice: 'ስሌት',
  detail: 'ዝርዝር',
  amount: 'መጠን',
  date: 'ቀን',
  time: 'ጊዜ',
  supplier: 'አቅራቢ',
  customer: 'ደንበኛ',
  type: 'ዓይነት',
  reference: 'ማመሳከሪያ ቁጥር',
  notes: 'ማስታወሻዎች',
  overview: 'ጠቅላላ እይታ',
  summary: 'ማጠቃለያ',
  transactionCount: 'የልውውጥ ቁጥር',
  totalAmount: 'ጠቅላላ መጠን',
};

const om: WithholdingStrings = {
  tabTitle: 'Wallagaa',
  title: 'Wallagaa',
  manageWithholding: 'Heduu-suuqa wallagaa bulchuu',
  withheldAmount: 'Hammam Wallagaa',
  vatWithheld: 'VAT Wallagaa',
  count: 'Lakkooba',
  searchPlaceholder: 'Lakkoobsa heduu-suuqa, walxaxaa, ykn II barbaadi...',
  filterButton: 'Calaqqisi',
  noWithholdingTitle: 'Heduu-suuqa wallagaa hin jiru',
  noWithholdingMessage: 'Heduu-suuqa wallagaa as mul\'atu',
  analytics: 'Xiinxala Odeeffannoo',
  totalWithheld: 'Waliigalaa Wallagaa',
  taxWithheld: 'Taankaa Wallagaa',
  vatWithheld: 'VAT Wallagaa',
  customRange: 'Hammam Filannoo',
  from: 'Irraa',
  to: 'Hanga',
  reset: 'Irra deebi\'i',
  applyFilters: 'Calaqqisuuwwan Haa\'i',
  status: 'Haal',
  allStatus: 'Haalawwan Hunda',
  completed: 'Xumurame',
  pending: 'Eegamaa jira',
  cancelled: 'Hquu\'e',
  filterTitle: 'Calaqqisuuwwan Wallagaa',
  dateRange: 'Hammam Guyyaa',
  today: 'Guyyaa Kana',
  yesterday: 'Kaleessa',
  thisWeek: 'Wiikii Kana',
  thisMonth: 'Ji\'a Kana',
  receipt: 'Heduu-suuqa',
  invoice: 'Gaafii',
  detail: 'Bal\'ina',
  amount: 'Hammam',
  date: 'Guyyaa',
  time: 'Yeroo',
  supplier: 'Karaa',
  customer: 'Fayyadamaa',
  type: 'Gosa',
  reference: 'Lakkoobsa Ittiin Yaadatamu',
  notes: 'Yaadadoo',
  overview: 'Hubachisuun Waliigalaa',
  summary: 'Xiinxala Gabaabaa',
  transactionCount: 'Lakkooba Yaalaa',
  totalAmount: 'Waliigalaa Hammam',
};

const ti: WithholdingStrings = {
  tabTitle: 'ተኸፍሊ',
  title: 'ተኸፍሊ',
  manageWithholding: 'ናይ ተኸፍሊ ሽምምዝ ኢዳት',
  withheldAmount: 'ተኸፍሊ መጠን',
  vatWithheld: 'ተኸፍሊ ቨ.ኤ.ቲ',
  count: 'ቁጽሪ',
  searchPlaceholder: 'ብቁጽሪ ሽምምዝ፣ ቃልሳ ወይ II ድለ...',
  filterButton: 'ጽንቅሳቕ',
  noWithholdingTitle: 'ናይ ተኸፍሊ ሽምምዝ የለን',
  noWithholdingMessage: 'ናይ ተኸፍሊ ሽምምዝ ኣብዚ ክርአዩ እዮም',
  analytics: 'ትንታኔ',
  totalWithheld: 'ድምር ተኸፍሊ',
  taxWithheld: 'ተኸፍሊ ታክስ',
  vatWithheld: 'ተኸፍሊ ቨ.ኤ.ቲ',
  customRange: 'ምውጫ ወሰን',
  from: 'ካብ',
  to: 'ናብ',
  reset: 'ፈለና ሓድስ',
  applyFilters: 'ጽንቅሳቕ ግበር',
  status: 'ሁኔታ',
  allStatus: 'ሓሙሙ ሁኔታ',
  completed: 'ተዛዚሙ',
  pending: 'ኣብ ግዕዝ ምርጫ ዘሎ',
  cancelled: 'ተሓጺበ',
  filterTitle: 'ናይ ተኸፍሊ ጽንቅሳቕ',
  dateRange: 'ወሰን መዓልታት',
  today: 'ሎሚ',
  yesterday: 'ጸሊም',
  thisWeek: 'ዚህ ሳምንታት',
  thisMonth: 'ዚህ ወርሒ',
  receipt: 'ሽምምዝ',
  invoice: 'ሰሌዳ',
  detail: 'ዝርዝር',
  amount: 'መጠን',
  date: 'መዓልታ',
  time: 'ሰዓት',
  supplier: 'ነጋዴ',
  customer: 'ገዛኢ',
  type: 'ዓይነት',
  reference: 'ቁጽሪ ሪፈረንስ',
  notes: 'ማስታወሻ',
  overview: 'ሕቶ ሓፈሻዊ',
  summary: 'ምኽሪ ክሩዓት',
  transactionCount: 'ቁጽሪ ሥራዊ',
  totalAmount: 'ድምር መጠን',
};

const so: WithholdingStrings = {
  tabTitle: 'Kaydive',
  title: 'Kaydive',
  manageWithholding: 'Haliso rasiidka kaydiva',
  withheldAmount: 'Miiska Kaydiva',
  vatWithheld: 'VAT Kaydiva',
  count: 'Tirada',
  searchPlaceholder: 'Barbar ku oodhaysi lambar rasiidka, qaali, ama II...',
  filterButton: 'Sifi',
  noWithholdingTitle: 'Rasiidka kaydiva ma jiraan',
  noWithholdingMessage: 'Rasiidka kaydiva waxay halkan ku muuqdaan',
  analytics: 'Falanqaynta',
  totalWithheld: 'Kaydiva Oo Dhan',
  taxWithheld: 'Tax Kaydiva',
  vatWithheld: 'VAT Kaydiva',
  customRange: 'Diyaarada Filannada',
  from: 'Ka',
  to: 'Ilaa',
  reset: 'Dib u Eeg',
  applyFilters: 'Tol Sifiya',
  status: 'Xaalka',
  allStatus: 'Oo Dhan Xaalka',
  completed: 'Gacmeed',
  pending: 'Sugaya',
  cancelled: 'Lagu Joojiyay',
  filterTitle: 'Sifiya Kaydiva',
  dateRange: 'Jadwaal Taariikhda',
  today: 'Maanta',
  yesterday: 'Jir',
  thisWeek: 'Usbuucan',
  thisMonth: 'Bishan',
  receipt: 'Rasiidka',
  invoice: 'Fariimaha',
  detail: 'Farriin',
  amount: 'Miiska',
  date: 'Taarikh',
  time: 'Waqti',
  supplier: 'Ergada',
  customer: 'Alaab',
  type: 'Nooca',
  reference: 'Lambar Tixgelin',
  notes: 'Xusuusta',
  overview: 'Fikirka Guud',
  summary: 'Soo Xisuusin',
  transactionCount: 'Tirada Galmada',
  totalAmount: 'Miiska Oo Dhan',
};

export function getWithholdingStrings(language: string): WithholdingStrings {
  const langId = resolveLanguageId(language);
  const strings: Record<LanguageId, WithholdingStrings> = { en, am, om, ti, so };
  return strings[langId] || en;
}

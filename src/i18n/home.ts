import { resolveLanguageId, type LanguageId } from '@/data/languages';

export interface HomeStrings {
  tabTitle: string;
  welcome: string;
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  todaysSales: string;
  totalRevenue: string;
  noData: string;
  lowStockAlert: string;
  lowStockProducts: string;
  noLowStock: string;
  allProductsStocked: string;
  viewAll: string;
  quickActions: string;
  startSale: string;
  createInvoice: string;
  checkInventory: string;
  analytics: string;
  settings: string;
  offline: string;
  offlineMessage: string;
  reconnecting: string;
  online: string;
  inventory: string;
  sales: string;
  invoices: string;
  recent: string;
  noRecentTransactions: string;
  changeLanguage: string;
  language: string;
  totalSales: string;
  transactions: string;
  itemsSold: string;
  avgSale: string;
  salesTrend: string;
  last7Days: string;
  topSellingProducts: string;
  unitsSold: string;
}

const en: HomeStrings = {
  tabTitle: 'Home',
  welcome: 'Welcome',
  goodMorning: 'Good Morning',
  goodAfternoon: 'Good Afternoon',
  goodEvening: 'Good Evening',
  todaysSales: "Today's Sales",
  totalRevenue: 'Total Revenue',
  noData: 'No data available',
  lowStockAlert: 'Low Stock Alert',
  lowStockProducts: 'Low Stock Products',
  noLowStock: 'No low stock products',
  allProductsStocked: 'All products are well stocked',
  viewAll: 'View All',
  quickActions: 'Quick Actions',
  startSale: 'Start Sale',
  createInvoice: 'Create Invoice',
  checkInventory: 'Check Inventory',
  analytics: 'Analytics',
  settings: 'Settings',
  offline: 'Offline',
  offlineMessage: 'You are currently offline. Some features may be limited.',
  reconnecting: 'Reconnecting...',
  online: 'Online',
  inventory: 'Inventory',
  sales: 'Sales',
  invoices: 'Invoices',
  recent: 'Recent',
  noRecentTransactions: 'No recent transactions',
  changeLanguage: 'Change Language',
  language: 'Language',
  totalSales: 'Total Sales',
  transactions: 'Transactions',
  itemsSold: 'Items Sold',
  avgSale: 'Avg. Sale',
  salesTrend: 'Sales Trend',
  last7Days: 'Last 7 days',
  topSellingProducts: 'Top Selling Products',
  unitsSold: 'units sold',
};

const am: HomeStrings = {
  tabTitle: 'መነሻ',
  welcome: 'እንኳን ደህና መጡ',
  goodMorning: 'ጥዋት ስላምታ',
  goodAfternoon: 'ሌሊት ስላምታ',
  goodEvening: 'ምሸት ስላምታ',
  todaysSales: 'የዛሬ ሽያጭ',
  totalRevenue: 'ጠቅላላ ገቢ',
  noData: 'ምንም ውሂብ የለም',
  lowStockAlert: 'ዝቅተኛ ክምችት ማጠንቀቂያ',
  lowStockProducts: 'ዝቅተኛ ክምችት ምርቶች',
  noLowStock: 'ዝቅተኛ ክምችት ምርቶች የለም',
  allProductsStocked: 'ሁሉም ምርቶች በደንብ ተከማችተዋል',
  viewAll: 'ሁሉንም ይመልከቱ',
  quickActions: 'ፈጣን ድርጊቶች',
  startSale: 'ሽያጭ ጀምር',
  createInvoice: 'ስሌት ፍጠር',
  checkInventory: 'ክምችት ይመልከቱ',
  analytics: 'ትንታኔዎች',
  settings: 'ቅንብሮች',
  offline: 'ከበር ጎደል',
  offlineMessage: 'በአሁኑ ሰአት ከበር ጎደለው ናቸዋል። አንዳንድ ባህሪዎች በተወሰነ ሁኔታ ውስጥ ሊሆን ይችላል።',
  reconnecting: 'እንደገና ሞصالح...',
  online: 'ኦንላይን',
  inventory: 'ክምችት',
  sales: 'ሽያጭ',
  invoices: 'ስሌቶች',
  recent: 'የቅርብ ጊዜ',
  noRecentTransactions: 'ምንም የቅርብ ጊዜ ሥራ የለም',
  changeLanguage: 'ቋንቋ ይቀይሩ',
  language: 'ቋንቋ',
  totalSales: 'ጠቅላላ ሽያጭ',
  transactions: 'ሥራዎች',
  itemsSold: 'ተሸጋገሩ ዕቃዎች',
  avgSale: 'አማካኝ ሽያጭ',
  salesTrend: 'የሽያጭ አዝማሚያ',
  last7Days: 'ባለፉት 7 ቀናት',
  topSellingProducts: 'በጣም ከፍተኛ ሽያጭ ምርቶች',
  unitsSold: 'ዩኒቶች ተሸጋገሩ',
};

const om: HomeStrings = {
  tabTitle: 'Mana',
  welcome: 'Akka ati dhufe',
  goodMorning: 'Gaggabiin qajeelcha',
  goodAfternoon: 'Galgala qajeelcha',
  goodEvening: 'Raatii qajeelcha',
  todaysSales: 'Gurgurtaan Guyyaa Kana',
  totalRevenue: 'Galii Waliigalaa',
  noData: 'Hin jiru odeeffannoo',
  lowStockAlert: 'Himeessa Kuusaa Gadi',
  lowStockProducts: 'Oomishaalee Kuusaa Gadi',
  noLowStock: 'Oomishaalee kuusaa gadi hin jiru',
  allProductsStocked: 'Oomishaaleen hunduu akka gaaffii kuusama',
  viewAll: 'Hunda ilaali',
  quickActions: 'Gargaarsa Saffisaa',
  startSale: 'Gurgurtaa Jalqabi',
  createInvoice: 'Gaafii Aarsu',
  checkInventory: 'Kuusaa Sakatta',
  analytics: 'Xiinxala Odeeffannoo',
  settings: 'Qindaawwan',
  offline: 'Hin Qophaa Internetti',
  offlineMessage: 'Ammiyyaan internetti kee hin qophu. Qabiyyee muraasni hin hojjatan ta\'u.',
  reconnecting: 'Irra deebi\'i walqabsiisuun...',
  online: 'Internettii qofaa',
  inventory: 'Kuusaa',
  sales: 'Gurgurtaa',
  invoices: 'Gaaffilee',
  recent: 'Dhiyoo',
  noRecentTransactions: 'Hojii dhiyoo hin jiru',
  changeLanguage: 'Afaan Jijjiiri',
  language: 'Afaan',
  totalSales: 'Waliigalaa Gurgurtaa',
  transactions: 'Hojiin Galmaa',
  itemsSold: 'Oomishaalee Gurgurte',
  avgSale: 'Gurgurtaan Giddugaleessa',
  salesTrend: 'Akkaataa Gurgurtaa',
  last7Days: 'Guyyoota 7 Duraaniif',
  topSellingProducts: 'Oomishaalee Gurgurte Guddaa',
  unitsSold: 'yuniit gurgurte',
};

const ti: HomeStrings = {
  tabTitle: 'መእተዊ',
  welcome: 'እንኳን ጸንሓልና',
  goodMorning: 'ጥዋት ስላሞ',
  goodAfternoon: 'ድሕሪ ቀትሪ ስላሞ',
  goodEvening: 'ምሸት ስላሞ',
  todaysSales: 'ሎሚ ዝተሽያጡ',
  totalRevenue: 'ድምር ገቢ',
  noData: 'ዝርዝር የለን',
  lowStockAlert: 'ምጥሪ ክምችት ማንቂያ',
  lowStockProducts: 'ምጥሪ ክምችት ናይ ምርቶች',
  noLowStock: 'ምጥሪ ክምችት ምርቶች የለን',
  allProductsStocked: 'ሓሙሙ ምርቶች ብደንብ ተከማችተዋል',
  viewAll: 'ሓሙሙ ርእ',
  quickActions: 'ቅልጡፍ ስራ',
  startSale: 'ሽያጭ ምቅላል',
  createInvoice: 'ሰሌዳ ምቅላል',
  checkInventory: 'ክምችት ምርምር',
  analytics: 'ትንታኔ',
  settings: 'ምውጫታት',
  offline: 'ኢንተርነት የለን',
  offlineMessage: 'ኣብዚ ግዜ ኢንተርነት የለዎም። ሓንቲ ባህርያት ምናልባት ኣይሰራን ይኸውን።',
  reconnecting: 'ተዋሕዶ ሊሳጠር...',
  online: 'ኢንተርነት ያሎ',
  inventory: 'ክምችት',
  sales: 'ሽያጭ',
  invoices: 'ሰሌዳታት',
  recent: 'ናይ ቀረባ',
  noRecentTransactions: 'ናይ ቀረባ ስራ የለን',
  changeLanguage: 'ቋንቋ ምቅያር',
  language: 'ቋንቋ',
  totalSales: 'ድምር ሽያጭ',
  transactions: 'ሥራ ወለዶ',
  itemsSold: 'ምርቶች ዝተሸዩ',
  avgSale: 'ሚዲያን ሽያጭ',
  salesTrend: 'ናይ ሽያጭ ዝንባሌ',
  last7Days: 'መጨረሽቲ 7 መዓልታት',
  topSellingProducts: 'ምርቶች ዝተሸዩ ብከፍተኛ ደረጃ',
  unitsSold: 'ዩኒት ዝተሸዩ',
};

const so: HomeStrings = {
  tabTitle: 'Guriga',
  welcome: 'Salaam',
  goodMorning: 'Subax wanaagsan',
  goodAfternoon: 'Galab wanaagsan',
  goodEvening: 'Habeenka wanaagsan',
  todaysSales: 'Iibka Maanta',
  totalRevenue: 'Dakhliga Oo Dhan',
  noData: 'Waxba ma jiraan',
  lowStockAlert: 'Digniin Taajin Kharaji',
  lowStockProducts: 'Alaabu Taajin Kharaji',
  noLowStock: 'Alaabu taajin kharaji ma jiraan',
  allProductsStocked: 'Alaabta oo dhan waa la kaydiyey si fiican',
  viewAll: 'Fiiri oo Dhan',
  quickActions: 'Ficilada Degdeg ah',
  startSale: 'Bilow Iibka',
  createInvoice: 'Abuur Fariimaha',
  checkInventory: 'Akhriso Kharaji',
  analytics: 'Falanqaynta',
  settings: 'Qeexitaannada',
  offline: 'Iska Diiwaan-galine',
  offlineMessage: 'Hadda waad offline noqotay. Qoladihii qaarkood aysan shaqayn karaan.',
  reconnecting: 'Ku Celinaaya...',
  online: 'Ku Jira',
  inventory: 'Kharaji',
  sales: 'Iibka',
  invoices: 'Fariimaha',
  recent: 'Lasoo Dhaafay',
  noRecentTransactions: 'Ma jiraan galmada lasoo dhaafay',
  changeLanguage: 'Badal Luqada',
  language: 'Luqada',
  totalSales: 'Iibka Oo Dhan',
  transactions: 'Galmada Ganacsiga',
  itemsSold: 'Alaabu la Iibiyey',
  avgSale: 'Iibka Dhexdhexaad',
  salesTrend: 'Habka Iibka',
  last7Days: 'Malmaha 7 ee Dambay',
  topSellingProducts: 'Alaabu Ugu Badan loo Iibiyey',
  unitsSold: 'yuniit la iibiyey',
};

export function getHomeStrings(language: string): HomeStrings {
  const langId = resolveLanguageId(language);
  const strings: Record<LanguageId, HomeStrings> = { en, am, om, ti, so };
  return strings[langId] || en;
}

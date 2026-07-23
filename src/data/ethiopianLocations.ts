export type LocationOption = { id: string; label: string };

export type EthiopiaZone = LocationOption & {
  weredas: LocationOption[];
};

export type EthiopiaRegion = LocationOption & {
  zones: EthiopiaZone[];
};

export const DEFAULT_COUNTRY_ID = 'ET';

export const CUSTOMER_COUNTRIES: LocationOption[] = [
  { id: 'ET', label: 'Ethiopia' },
  { id: 'DJ', label: 'Djibouti' },
  { id: 'ER', label: 'Eritrea' },
  { id: 'KE', label: 'Kenya' },
  { id: 'SO', label: 'Somalia' },
  { id: 'SD', label: 'Sudan' },
  { id: 'SS', label: 'South Sudan' },
  { id: 'UG', label: 'Uganda' },
  { id: 'US', label: 'United States' },
  { id: 'GB', label: 'United Kingdom' },
  { id: 'AE', label: 'United Arab Emirates' },
  { id: 'SA', label: 'Saudi Arabia' },
];

function weredas(...labels: string[]): LocationOption[] {
  return labels.map((label) => ({
    id: label.toLowerCase().replace(/\s+/g, '-'),
    label,
  }));
}

export const ETHIOPIA_REGIONS: EthiopiaRegion[] = [
  {
    id: 'addis-ababa',
    label: 'Addis Ababa',
    zones: [
      { id: 'addis-ketema', label: 'Addis Ketema', weredas: weredas('Wereda 01', 'Wereda 02', 'Wereda 03', 'Wereda 04') },
      { id: 'akaky-kaliti', label: 'Akaky Kaliti', weredas: weredas('Wereda 01', 'Wereda 02', 'Wereda 03', 'Wereda 04') },
      { id: 'arada', label: 'Arada', weredas: weredas('Wereda 01', 'Wereda 02', 'Wereda 03', 'Wereda 04') },
      { id: 'bole', label: 'Bole', weredas: weredas('Wereda 03', 'Wereda 04', 'Wereda 05', 'Wereda 06', 'Wereda 07') },
      { id: 'gulele', label: 'Gulele', weredas: weredas('Wereda 01', 'Wereda 02', 'Wereda 03', 'Wereda 04') },
      { id: 'kirkos', label: 'Kirkos', weredas: weredas('Wereda 01', 'Wereda 02', 'Wereda 03', 'Wereda 04') },
      { id: 'kolfe-keranio', label: 'Kolfe Keranio', weredas: weredas('Wereda 01', 'Wereda 02', 'Wereda 03', 'Wereda 04') },
      { id: 'lideta', label: 'Lideta', weredas: weredas('Wereda 01', 'Wereda 02', 'Wereda 03', 'Wereda 04') },
      { id: 'nifas-silk-lafto', label: 'Nifas Silk-Lafto', weredas: weredas('Wereda 01', 'Wereda 02', 'Wereda 03', 'Wereda 04') },
      { id: 'yeka', label: 'Yeka', weredas: weredas('Wereda 01', 'Wereda 02', 'Wereda 03', 'Wereda 04') },
    ],
  },
  {
    id: 'afar',
    label: 'Afar',
    zones: [
      { id: 'awash', label: 'Awash', weredas: weredas('Awash Fentale', 'Amibara', 'Dubti') },
      { id: 'kilbet-rasu', label: 'Kilbet Rasu', weredas: weredas('Abala', 'Berhale', 'Erebti') },
      { id: 'zone-3', label: 'Zone 3', weredas: weredas('Afar Sabae', 'Dulecha', 'Gewane') },
    ],
  },
  {
    id: 'amhara',
    label: 'Amhara',
    zones: [
      { id: 'north-gondar', label: 'North Gondar', weredas: weredas('Gondar Zuria', 'Lay Armachiho', 'Dembia') },
      { id: 'south-gondar', label: 'South Gondar', weredas: weredas('Fogera', 'Farta', 'Este') },
      { id: 'north-wollo', label: 'North Wollo', weredas: weredas('Woldiya', 'Habru', 'Guba Lafto') },
      { id: 'south-wollo', label: 'South Wollo', weredas: weredas('Dessie Zuria', 'Kutaber', 'Tenta') },
      { id: 'east-gojjam', label: 'East Gojjam', weredas: weredas('Debre Markos', 'Enarj Enawga', 'Enebse Sar Midir') },
      { id: 'west-gojjam', label: 'West Gojjam', weredas: weredas('Finote Selam', 'Jabitena', 'Goncha Sisso') },
    ],
  },
  {
    id: 'benishangul-gumuz',
    label: 'Benishangul-Gumuz',
    zones: [
      { id: 'assosa', label: 'Assosa', weredas: weredas('Assosa Zuria', 'Bambasi', 'Menge') },
      { id: 'kamashi', label: 'Kamashi', weredas: weredas('Kamashi Zuria', 'Mizan Aman', 'Sedal') },
    ],
  },
  {
    id: 'central-ethiopia',
    label: 'Central Ethiopia',
    zones: [
      { id: 'hadiya', label: 'Hadiya', weredas: weredas('Hosaena', 'Shashogo', 'Limmo') },
      { id: 'kembata-tembaro', label: 'Kembata Tembaro', weredas: weredas('Durame', 'Kacha Bira', 'Angacha') },
    ],
  },
  {
    id: 'dire-dawa',
    label: 'Dire Dawa',
    zones: [
      { id: 'dire-dawa-city', label: 'Dire Dawa City', weredas: weredas('Gende Kore', 'Melka Jebdu', 'Sabian') },
    ],
  },
  {
    id: 'gambela',
    label: 'Gambela',
    zones: [
      { id: 'agnewak', label: 'Agnewak', weredas: weredas('Gambela Zuria', 'Itang', 'Abobo') },
      { id: 'nuer', label: 'Nuer', weredas: weredas('Lare', 'Jikawo', 'Makuey') },
    ],
  },
  {
    id: 'harari',
    label: 'Harari',
    zones: [
      { id: 'harari-people', label: 'Harari People', weredas: weredas('Amir Nur', 'Abadir', 'Sofi') },
    ],
  },
  {
    id: 'oromia',
    label: 'Oromia',
    zones: [
      { id: 'east-shewa', label: 'East Shewa', weredas: weredas('Adama', 'Bishoftu', 'Dukem', 'Modjo') },
      { id: 'west-shewa', label: 'West Shewa', weredas: weredas('Ambo', 'Ejere', 'Guder') },
      { id: 'jimma', label: 'Jimma', weredas: weredas('Jimma', 'Mana', 'Sigmo') },
      { id: 'west-wollega', label: 'West Wollega', weredas: weredas('Nekemte', 'Gimbi', 'Boji') },
      { id: 'bale', label: 'Bale', weredas: weredas('Robe', 'Goba', 'Dinsho') },
    ],
  },
  {
    id: 'sidama',
    label: 'Sidama',
    zones: [
      { id: 'sidama-zone', label: 'Sidama Zone', weredas: weredas('Hawassa Zuria', 'Dale', 'Wondo Genet') },
    ],
  },
  {
    id: 'somali',
    label: 'Somali',
    zones: [
      { id: 'fafaan', label: 'Fafan', weredas: weredas('Jigjiga', 'Aw Barre', 'Kebri Beyah') },
      { id: 'siti', label: 'Siti', weredas: weredas('Shinile', 'Afdem', 'Mieso') },
    ],
  },
  {
    id: 'south-ethiopia',
    label: 'South Ethiopia',
    zones: [
      { id: 'gedeo', label: 'Gedeo', weredas: weredas('Dilla Zuria', 'Yirgachefe', 'Kochere') },
      { id: 'wolayita', label: 'Wolayita', weredas: weredas('Sodo Zuria', 'Damot Gale', 'Boloso Sore') },
    ],
  },
  {
    id: 'south-west-ethiopia',
    label: 'South West Ethiopia Peoples',
    zones: [
      { id: 'bench-sheko', label: 'Bench Sheko', weredas: weredas('Mizan Teferi', 'Sheko', 'Guraferda') },
      { id: 'kefa', label: 'Kefa', weredas: weredas('Bonga', 'Gewata', 'Decha') },
    ],
  },
  {
    id: 'tigray',
    label: 'Tigray',
    zones: [
      { id: 'central-tigray', label: 'Central Tigray', weredas: weredas('Aksum', 'Adwa', 'Ahferom') },
      { id: 'eastern-tigray', label: 'Eastern Tigray', weredas: weredas('Wukro', 'Gulo Mekeda', 'Saesi Tsaedaemba') },
      { id: 'southern-tigray', label: 'Southern Tigray', weredas: weredas('Alamata', 'Raya Azebo', 'Ofla') },
    ],
  },
];

export function isEthiopiaCountry(countryId?: string): boolean {
  if (!countryId) return false;
  return countryId === DEFAULT_COUNTRY_ID || countryId.toLowerCase() === 'ethiopia';
}

export function getCountryLabel(countryId?: string): string | undefined {
  return CUSTOMER_COUNTRIES.find((country) => country.id === countryId)?.label;
}

export function getEthiopiaRegion(regionId?: string): EthiopiaRegion | undefined {
  return ETHIOPIA_REGIONS.find((region) => region.id === regionId);
}

export function getEthiopiaZone(regionId?: string, zoneId?: string): EthiopiaZone | undefined {
  return getEthiopiaRegion(regionId)?.zones.find((zone) => zone.id === zoneId);
}

export function getEthiopiaRegionLabel(regionId?: string): string | undefined {
  return getEthiopiaRegion(regionId)?.label;
}

export function getEthiopiaZoneLabel(regionId?: string, zoneId?: string): string | undefined {
  return getEthiopiaZone(regionId, zoneId)?.label;
}

export function getEthiopiaWeredaLabel(
  regionId?: string,
  zoneId?: string,
  weredaId?: string
): string | undefined {
  return getEthiopiaZone(regionId, zoneId)?.weredas.find((wereda) => wereda.id === weredaId)?.label;
}

export function formatCountryForApi(countryId?: string): string | undefined {
  if (!countryId?.trim()) return undefined;
  if (isEthiopiaCountry(countryId)) return 'ET';
  return countryId.trim();
}

export const PRODUCT_TYPES = [
  { id: 'storable', label: 'Good' },
  { id: 'service', label: 'Service' },
  { id: 'consu', label: 'Consumable' },
] as const;

export type ProductTypeId = (typeof PRODUCT_TYPES)[number]['id'];

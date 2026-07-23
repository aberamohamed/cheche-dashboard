export const POS_CURRENCY = 'ETB';

export const POS_UOM_ID = '6dff0e4e-1801-43dc-8a64-4534d9c1ce93';

export const POS_TAX_IDS = ['e5255fa6-52e9-485a-b47f-0c44cc6536b7'] as const;

export const POS_ORDER_DEFAULTS = {
  coupon_id: null,
  coupon_discount: 0,
  gift_card_number: null,
  gift_card_discount: 0,
  loyalty_points: 0,
  loyalty_discount: 0,
  applied_promotions: [] as unknown[],
  total_discount: 0,
} as const;

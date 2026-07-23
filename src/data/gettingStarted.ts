export type GettingStartedSlide = {
  id: string;
  title: string;
  description: string;
  image: number;
};

export type GettingStartedMethod = {
  id: string;
  label: string;
  hint: string;
  icon: 'etrade' | 'manual';
  action: 'alert' | 'navigate';
  target?: string;
};

export const GETTING_STARTED_SLIDES: GettingStartedSlide[] = [
  {
    id: '1',
    title: 'Fast Checkout',
    description: 'Ring up sales quickly with scan, keypad, and flexible payment options',
    image: require('../../assets/images/1.png'),
  },
  {
    id: '2',
    title: 'Inventory Control',
    description: 'Manage products, categories, stock levels, and low-stock alerts in one place',
    image: require('../../assets/images/2.png'),
  },
  {
    id: '3',
    title: 'Invoices & Receipts',
    description: 'Create invoices, print receipts, and keep sales records organized',
    image: require('../../assets/images/3.png'),
  },
  {
    id: '4',
    title: 'Business Insights',
    description: 'Track today’s sales, review history, and monitor store performance',
    image: require('../../assets/images/4.png'),
  },
  {
    id: '5',
    title: 'Promotions & Pricing',
    description: 'Run coupons, gift cards, item prices, and exchange rates with ease',
    image: require('../../assets/images/5.png'),
  },
];

export const GETTING_STARTED_METHODS: GettingStartedMethod[] = [
  {
    id: 'etrade',
    label: 'Continue with eTrade',
    hint: 'Verify your business license on eTrade using your TIN',
    icon: 'etrade',
    action: 'navigate',
    target: '/(auth)/register-plan',
  },
  {
    id: 'manual',
    label: 'Manual Registration',
    hint: 'Set up your business, plan, and owner profile',
    icon: 'manual',
    action: 'navigate',
    target: '/(auth)/register-plan',
  },
];

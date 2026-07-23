export type ContactMethod = {
  id: string;
  title: string;
  value: string;
  icon: 'globe-outline' | 'mail-outline' | 'call-outline' | 'location-outline';
  url: string;
  color: string;
  actionLabel?: string;
};

export const CONTACT_METHODS: ContactMethod[] = [
  {
    id: 'website',
    title: 'Our Website',
    value: 'www.cheche.com.et',
    icon: 'globe-outline',
    url: 'https://cheche.com.et/',
    color: '#3B82F6',
    actionLabel: 'Open',
  },
  {
    id: 'email',
    title: 'Email Support',
    value: 'info@Cheche.et',
    icon: 'mail-outline',
    url: 'mailto:support@cheche.com',
    color: '#10B981',
    actionLabel: 'Mail',
  },
  {
    id: 'call',
    title: 'Callcenter Support',
    value: '+251 11 639 3311',
    icon: 'call-outline',
    url: 'tel:+251116393311',
    color: '#F59E0B',
    actionLabel: 'Call',
  },
  {
    id: 'location',
    title: 'Our Location',
    value: 'Oromia Tower, 3rd Floor, Addis Ababa',
    icon: 'location-outline',
    url: 'https://maps.app.goo.gl/45y8684988974566',
    color: '#EF4444',
  },
];

export const SOCIAL_LINKS = [
  { id: 'logo-twitter' as const, url: 'https://twitter.com/cheche-systems', color: '#1DA1F2' },
  { id: 'logo-facebook' as const, url: 'https://facebook.com/cheche-systems', color: '#1877F2' },
  { id: 'logo-whatsapp' as const, url: 'https://wa.me/251116393311', color: '#25D366' },
  { id: 'logo-linkedin' as const, url: 'https://www.linkedin.com/company/cheche-systems/posts/?feedView=all', color: '#0A66C2' },
  { id: 'logo-instagram' as const, url: 'https://www.instagram.com/chechesystem?igsh=eDAwcDl4Y3k5c2Nu', color: '#E4405F' },
];

export const WEBSITE_URL = 'https://cheche.com.et/';

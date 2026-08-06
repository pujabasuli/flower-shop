import type { OrderStatus } from '@/types';

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Custom Bouquet', href: '/custom-bouquet' },
  { label: 'About', href: '/#about' },
] as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: 'Order Received',
  accepted: 'Accepted',
  preparing: 'Preparing Bouquet',
  ready: 'Ready for Pickup',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  'received',
  'accepted',
  'preparing',
  'ready',
  'completed',
];

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  received: 'bg-blue-100 text-blue-700 border-blue-200',
  accepted: 'bg-purple-100 text-purple-700 border-purple-200',
  preparing: 'bg-amber-100 text-amber-700 border-amber-200',
  ready: 'bg-green-100 text-green-700 border-green-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
};

export const ADVANCE_PERCENTAGES = [25, 50, 75, 100] as const;

export const DEFAULT_ADVANCE_PERCENT = 50;

export const ITEMS_PER_PAGE = 9;

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
] as const;

export const SHOP_NAME = 'Fleur & Bloom';
export const SHOP_TAGLINE = 'Artisan Bouquets, Made to Order';

export const CONTACT_INFO = {
  phone: '+91 98765 43210',
  email: 'hello@fleurbloom.com',
  address: '123 Garden Lane, Bengaluru, KA 560001',
  hours: 'Mon–Sat: 9 AM – 7 PM',
};

export const SOCIAL_LINKS = {
  instagram: 'https://instagram.com',
  facebook: 'https://facebook.com',
  pinterest: 'https://pinterest.com',
};

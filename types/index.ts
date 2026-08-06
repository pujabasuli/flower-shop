export type UserRole = 'customer' | 'admin';

export type OrderStatus =
  | 'received'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type PaymentType = 'advance' | 'remaining' | 'full';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'in_app';

export type GiftAddonType = 'chocolate' | 'teddy' | 'vase' | 'other';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Occasion {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface BouquetImage {
  id: string;
  bouquet_id: string;
  image_url: string;
  position: number;
  created_at: string;
}

export interface Bouquet {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  prep_time_minutes: number;
  stock: number;
  is_featured: boolean;
  is_active: boolean;
  category_id: string | null;
  flowers_included: string | null;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  images?: BouquetImage[];
  occasions?: Occasion[];
  reviews?: Review[];
}

export interface Flower {
  id: string;
  name: string;
  color: string | null;
  price_cents: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface WrappingPaper {
  id: string;
  name: string;
  color: string | null;
  price_cents: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Ribbon {
  id: string;
  name: string;
  color: string | null;
  price_cents: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface GreetingCard {
  id: string;
  name: string;
  design: string | null;
  price_cents: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface GiftAddon {
  id: string;
  name: string;
  type: GiftAddonType;
  price_cents: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CustomBouquetFlower {
  flower_id: string;
  name: string;
  quantity: number;
  price_cents: number;
}

export interface CustomBouquet {
  id: string;
  user_id: string;
  name: string;
  flowers: CustomBouquetFlower[];
  wrapping_paper_id: string | null;
  ribbon_id: string | null;
  greeting_card_id: string | null;
  card_message: string | null;
  gift_addon_ids: string[];
  budget_cents: number | null;
  inspiration_image_url: string | null;
  total_price_cents: number;
  created_at: string;
}

export interface Review {
  id: string;
  bouquet_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profile?: Pick<Profile, 'full_name'> | null;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  bouquet_id: string;
  created_at: string;
  bouquet?: Bouquet;
}

export interface PickupSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_orders: number;
  is_active: boolean;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  advance_percent: number;
  advance_paid_cents: number;
  remaining_cents: number;
  pickup_date: string | null;
  pickup_time: string | null;
  special_instructions: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  coupon_code: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  payments?: Payment[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  bouquet_id: string | null;
  custom_bouquet_id: string | null;
  name: string;
  image_url: string | null;
  quantity: number;
  unit_price_cents: number;
  total_price_cents: number;
  metadata: Record<string, unknown>;
}

export interface Payment {
  id: string;
  order_id: string;
  amount_cents: number;
  type: PaymentType;
  status: PaymentStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  order_id: string | null;
  channel: NotificationChannel;
  subject: string | null;
  message: string | null;
  status: 'queued' | 'sent' | 'failed';
  created_at: string;
}

export interface CartItem {
  id: string;
  type: 'bouquet' | 'custom';
  bouquet_id?: string;
  custom_bouquet?: CustomBouquet;
  name: string;
  image_url?: string;
  unit_price_cents: number;
  quantity: number;
}

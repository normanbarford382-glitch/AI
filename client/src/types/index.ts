export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  price: number;
  discountPrice?: number | null;
  stock: number;
  images: string[];
  thumbnail?: string | null;
  brand?: string | null;
  model?: string | null;
  specsAr?: Record<string, string> | null;
  specsEn?: Record<string, string> | null;
  isFeatured: boolean;
  isActive: boolean;
  slug: string;
  sku?: string | null;
  tags: string[];
  categoryId: string;
  category?: Category;
  reviews?: Review[];
  _count?: { reviews: number };
  avgRating?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  image?: string | null;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface Order {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  address: string;
  shippingAddress?: string | null;
  shippingBranch?: string | null;
  status: string;
  totalAmount: number;
  paymentMethod?: string | null;
  paidFromWallet: boolean;
  walletAmountUsed?: number | null;
  discountAmount?: number | null;
  notes?: string | null;
  items: OrderItem[];
  user?: { name?: string; email: string };
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  isActive: boolean;
}

export interface PaymentMethod {
  id: string;
  nameAr: string;
  nameEn: string;
  description?: string | null;
  accountInfo?: string | null;
  logo?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment?: string | null;
  user?: { name?: string; avatar?: string };
  createdAt: string | Date;
}

export interface Notification {
  id: string;
  userId: string;
  titleAr: string;
  titleEn: string;
  bodyAr?: string | null;
  bodyEn?: string | null;
  link?: string | null;
  isRead: boolean;
  createdAt: string | Date;
}

export interface Banner {
  id: string;
  titleAr?: string | null;
  titleEn?: string | null;
  subtitleAr?: string | null;
  subtitleEn?: string | null;
  image: string;
  link?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface SiteSettings {
  siteName?: string;
  logo?: string;
  maintenanceMode?: boolean;
  walletEnabled?: boolean;
  currency?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  whatsapp?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}


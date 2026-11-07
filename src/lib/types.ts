export type Variant = { name: string; options: string[] };
export type VariantCombination = { options: Record<string, string>; price: number; salePrice: number | null; sku: string; stock: number; images: string[] };

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string; // category slug
  description: string;
  price: number; // regular price
  salePrice: number | null; // current selling price when discounted
  images: string[];
  variants: Variant[];
  variantCombinations: VariantCombination[];
  stock: number;
  status: 'active' | 'draft';
  badge: 'Hot' | 'New' | null;
  rating: number | null; // only shown when the owner enters real review data
  reviewCount: number;
  bestSeller: boolean;
  sku: string;
  createdAt: string;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  image: string;
  description: string;
  sort: number;
};

export type StoreSettings = {
  storeName: string;
  tagline: string;
  whatsappNumber: string; // digits only, international format, e.g. 923435295541
  currency: string;
  currencySymbol: string;
  shippingFlat: number; // 0 = free shipping
  freeShippingOver: number; // 0 = no threshold
  logoUrl: string;
  email: string;
  phone: string;
  address: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  pinterest: string;
  facebook: string;
  theme: string; // see src/lib/themes.ts
};

export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  qty: number;
  variant?: string;
  variantOptions?: Record<string, string>;
};

export type Order = {
  id: string;
  orderNumber: string;
  source: 'whatsapp-cart' | 'manual';
  status: OrderStatus;
  customerName: string;
  whatsapp: string;
  country: string;
  city: string;
  address: string;
  notes: string;
  adminNotes: string; // private, admin only
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  createdAt: string;
};

export type ProductSummary = Pick<
  Product,
  'id' | 'slug' | 'name' | 'price' | 'salePrice' | 'badge' | 'rating' | 'reviewCount' | 'stock' | 'category'
> & { image: string; hasVariants: boolean };

export const effectivePrice = (p: { price: number; salePrice: number | null }) =>
  p.salePrice !== null && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;

export const toSummary = (p: Product): ProductSummary => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  price: p.price,
  salePrice: p.salePrice,
  badge: p.badge,
  rating: p.rating,
  reviewCount: p.reviewCount,
  stock: p.stock,
  category: p.category,
  image: p.images[0] ?? '/images/hero.jpg',
  hasVariants: p.variants.length > 0,
});

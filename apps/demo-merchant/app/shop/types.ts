export type Product = {
  id: string;
  merchantId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  /** Price in the smallest currency unit (e.g. paise for INR). */
  price: number;
  currency: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type CartMap = Record<string, CartItem>;

export function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price / 100);
}

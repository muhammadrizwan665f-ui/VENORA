// Pure cart helpers (unit-tested).

export type CartLine = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number; // unit price at time of adding
  qty: number;
  variant?: string;
  variantOptions?: Record<string, string>;
};

export const MAX_QTY = 99;

export const lineKey = (productId: string, variant?: string) => `${productId}::${variant ?? ''}`;
export const round2 = (n: number) => Math.round(n * 100) / 100;

export function addLine(lines: CartLine[], line: Omit<CartLine, 'key'>): CartLine[] {
  const key = lineKey(line.productId, line.variant);
  const existing = lines.find((l) => l.key === key);
  if (existing) {
    return lines.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, l.qty + line.qty), price: line.price } : l));
  }
  return [...lines, { ...line, key, qty: Math.min(MAX_QTY, Math.max(1, line.qty)) }];
}

export function setQty(lines: CartLine[], key: string, qty: number): CartLine[] {
  if (qty <= 0) return lines.filter((l) => l.key !== key);
  return lines.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, qty) } : l));
}

export const removeLine = (lines: CartLine[], key: string) => lines.filter((l) => l.key !== key);
export const countItems = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty, 0);
export const subtotalOf = (lines: CartLine[]) => round2(lines.reduce((s, l) => s + l.price * l.qty, 0));

export function shippingFor(subtotal: number, cfg: { shippingFlat: number; freeShippingOver: number }): number {
  if (subtotal <= 0 || cfg.shippingFlat <= 0) return 0;
  if (cfg.freeShippingOver > 0 && subtotal >= cfg.freeShippingOver) return 0;
  return round2(cfg.shippingFlat);
}

export function totals(lines: CartLine[], cfg: { shippingFlat: number; freeShippingOver: number }) {
  const subtotal = subtotalOf(lines);
  const shipping = shippingFor(subtotal, cfg);
  return { subtotal, shipping, total: round2(subtotal + shipping) };
}

/** Defensive parse of whatever is in localStorage. */
export function parseLines(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((l) => l && typeof l.productId === 'string' && typeof l.price === 'number' && Number.isFinite(l.qty) && l.qty > 0)
      .map((l) => ({
        key: lineKey(l.productId, l.variant || undefined),
        productId: l.productId,
        slug: String(l.slug ?? ''),
        name: String(l.name ?? ''),
        image: String(l.image ?? ''),
        price: l.price,
        qty: Math.min(MAX_QTY, Math.floor(l.qty)),
        variant: l.variant || undefined,
        variantOptions: l.variantOptions && typeof l.variantOptions === 'object' ? l.variantOptions : undefined,
      }));
  } catch {
    return [];
  }
}

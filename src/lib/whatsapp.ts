// Pure helpers (no framework imports) so they can be unit-tested.

export const DEFAULT_WHATSAPP = '923435295541';

/** Digits only, international format. A single leading 0 is treated as a Pakistan local number (+92). */
export function normalizeWhatsapp(input: string): string {
  let d = (input || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = '92' + d.slice(1);
  return d;
}

export function waLink(number: string, text: string): string {
  const n = normalizeWhatsapp(number) || DEFAULT_WHATSAPP;
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

export function money(amount: number, symbol = '$'): string {
  return `${symbol}${(Math.round(amount * 100) / 100).toFixed(2)}`;
}

export type ProductMessageInput = {
  name: string;
  price: number;
  quantity: number;
  url: string;
  variant?: string;
  symbol?: string;
  outOfStock?: boolean;
};

export function buildProductMessage(i: ProductMessageInput): string {
  const lines = [
    'Hello VENORA JEWELRY!',
    '',
    'I would like to order the following product:',
    '',
    `Product: ${i.name}`,
  ];
  if (i.variant) lines.push(`Variant: ${i.variant}`);
  lines.push(`Price: ${money(i.price, i.symbol)}`, `Quantity: ${i.quantity}`, `Product Link: ${i.url}`, '');
  lines.push(
    i.outOfStock
      ? 'This item shows as out of stock on the website. Please let me know if it can be restocked or reserved, and the delivery details.'
      : 'Please confirm availability and delivery details.',
  );
  lines.push('', 'Thank you!');
  return lines.join('\n');
}

export type CartMessageLine = { name: string; price: number; qty: number; variant?: string; url: string };
export type CustomerDetails = {
  name: string;
  whatsapp: string;
  country: string;
  city: string;
  address: string;
  notes?: string;
};

export type CartMessageInput = {
  ref: string;
  lines: CartMessageLine[];
  customer: CustomerDetails;
  subtotal: number;
  shipping: number;
  total: number;
  symbol?: string;
};

export function buildCartMessage(i: CartMessageInput): string {
  const s = i.symbol ?? '$';
  const out: string[] = ['Hello VENORA JEWELRY!', '', 'I would like to place the following order:', '', `*Order Ref:* ${i.ref}`, '', '*Items*'];
  i.lines.forEach((l, idx) => {
    out.push(`${idx + 1}. ${l.name}${l.variant ? ` (${l.variant})` : ''}`);
    out.push(`   ${l.qty} x ${money(l.price, s)} = ${money(l.price * l.qty, s)}`);
    out.push(`   ${l.url}`);
  });
  out.push(
    '',
    `*Subtotal:* ${money(i.subtotal, s)}`,
    `*Shipping:* ${i.shipping > 0 ? money(i.shipping, s) : 'Free'}`,
    `*Total:* ${money(i.total, s)}`,
    '',
    '*Customer Details*',
    `Name: ${i.customer.name}`,
    `WhatsApp: ${i.customer.whatsapp}`,
    `Country: ${i.customer.country}`,
    `City: ${i.customer.city}`,
    `Address: ${i.customer.address}`,
  );
  if (i.customer.notes?.trim()) out.push(`Notes: ${i.customer.notes.trim()}`);
  out.push('', 'Please confirm availability, the final total and payment details.', '', 'Thank you!');
  return out.join('\n');
}

export function generateOrderRef(now = new Date(), rand = Math.random): string {
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const code = Math.floor(rand() * 36 ** 4).toString(36).toUpperCase().padStart(4, '0');
  return `VEN-${yy}${mm}${dd}-${code}`;
}

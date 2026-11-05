export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
export const productUrl = (slug: string, base = siteUrl()) => `${base}/product/${slug}`;

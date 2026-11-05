import type { Category, Product, StoreSettings } from './types';

export const defaultSettings: StoreSettings = {
  storeName: 'VENORA JEWELRY',
  tagline: 'Elegance With An Edge.',
  whatsappNumber: '923435295541',
  currency: 'USD',
  currencySymbol: '$',
  shippingFlat: 0,
  freeShippingOver: 0,
  logoUrl: '/images/emblem.png',
  email: '',
  phone: '+92 343 5295541',
  address: '',
  instagram: '',
  tiktok: '',
  youtube: '',
  pinterest: '',
  facebook: '',
  theme: 'noir-gold',
};

export const seedCategories: Category[] = [
  { id: 'c1', slug: 'necklaces', name: 'Necklaces', image: '/images/col-necklaces.jpg', description: 'Serpent pendants, chokers and woven mesh chains.', sort: 1 },
  { id: 'c2', slug: 'bracelets', name: 'Bracelets', image: '/images/col-bracelets.jpg', description: 'Coiled serpent bracelets and bangles.', sort: 2 },
  { id: 'c3', slug: 'rings', name: 'Rings', image: '/images/col-rings.jpg', description: 'Statement snake rings set with sparkling stones.', sort: 3 },
  { id: 'c4', slug: 'earrings', name: 'Earrings', image: '/images/col-earrings.jpg', description: 'Serpent drops that move with you.', sort: 4 },
  { id: 'c5', slug: 'anklets', name: 'Anklets', image: '/images/col-anklets.jpg', description: 'Delicate charm anklets with a serpent edge.', sort: 5 },
  { id: 'c6', slug: 'jewelry-sets', name: 'Jewelry Sets', image: '/images/col-sets.jpg', description: 'Matching sets, ready to gift or wear together.', sort: 6 },
];

const longDesc = (what: string) =>
  `${what} Crafted in the signature VENORA serpent style with a warm champagne-gold finish and a bold, feminine silhouette. Each piece is inspected by hand and arrives in our complimentary luxury packaging.`;

const base = {
  status: 'active' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  rating: null,
  reviewCount: 0,
};

export const seedProducts: Product[] = [
  {
    ...base, id: 'p1', slug: 'colorful-woven-mesh-necklace', name: 'Colorful Woven Mesh Necklace', category: 'necklaces',
    description: longDesc('A vivid woven mesh chain in jewel tones that stacks beautifully or stands alone.'),
    price: 19.99, salePrice: 12.99, badge: 'Hot', bestSeller: true, stock: 40, sku: 'VEN-NK-001',
    images: ['/images/p1-mesh.jpg', '/images/p1-mesh-2.jpg', '/images/p1-mesh-3.jpg'],
    variants: [{ name: 'Colour', options: ['Multicolour', 'Red', 'Teal', 'Purple'] }],
  },
  {
    ...base, id: 'p2', slug: 'snake-style-choker-necklace', name: 'Snake Style Choker Necklace', category: 'necklaces',
    description: longDesc('A snakeskin-pattern choker that sits close to the collarbone for an unmistakable edge.'),
    price: 22.99, salePrice: 14.99, badge: 'New', bestSeller: true, stock: 25, sku: 'VEN-NK-002',
    images: ['/images/p2-choker.jpg', '/images/d-choker.jpg'],
    variants: [{ name: 'Length', options: ['14"', '16"', '18"'] }],
  },
  {
    ...base, id: 'p3', slug: 'serpent-bracelet', name: 'Serpent Bracelet', category: 'bracelets',
    description: longDesc('A coiled serpent bracelet with a jewelled eye and fine scale texture.'),
    price: 24.99, salePrice: 16.99, badge: 'Hot', bestSeller: true, stock: 30, sku: 'VEN-BR-001',
    images: ['/images/p3-bracelet.jpg', '/images/z-bracelet.jpg'],
    variants: [{ name: 'Size', options: ['Small', 'Medium', 'Large'] }],
  },
  {
    ...base, id: 'p4', slug: 'serpent-earrings', name: 'Serpent Earrings', category: 'earrings',
    description: longDesc('Sinuous serpent drop earrings that catch the light with every movement.'),
    price: 14.99, salePrice: 9.99, badge: 'New', bestSeller: true, stock: 50, sku: 'VEN-ER-001',
    images: ['/images/p4-earrings.jpg', '/images/d-earring.jpg'],
    variants: [],
  },
  {
    ...base, id: 'p5', slug: 'snake-ring', name: 'Snake Ring', category: 'rings',
    description: longDesc('A coiled snake ring with emerald-toned eyes and a pavé body.'),
    price: 17.99, salePrice: 11.99, badge: 'Hot', bestSeller: true, stock: 35, sku: 'VEN-RG-001',
    images: ['/images/p5-ring.jpg', '/images/z-ring.jpg', '/images/d-rings.jpg'],
    variants: [{ name: 'Ring size', options: ['6', '7', '8', '9'] }],
  },
  {
    ...base, id: 'p6', slug: 'serpent-coil-ring', name: 'Serpent Coil Ring', category: 'rings',
    description: longDesc('A double-coil serpent ring crowned with a single bright stone.'),
    price: 15.99, salePrice: 10.99, badge: null, bestSeller: false, stock: 28, sku: 'VEN-RG-002',
    images: ['/images/col-rings.jpg', '/images/col-rings-2.jpg', '/images/col-rings-3.jpg'],
    variants: [{ name: 'Ring size', options: ['6', '7', '8', '9'] }],
  },
  {
    ...base, id: 'p7', slug: 'golden-serpent-pendant-necklace', name: 'Golden Serpent Pendant Necklace', category: 'necklaces',
    description: longDesc('A fine golden chain with a winding serpent and a single brilliant stone.'),
    price: 27.99, salePrice: 18.99, badge: null, bestSeller: false, stock: 20, sku: 'VEN-NK-003',
    images: ['/images/col-necklaces.jpg', '/images/col-necklaces-2.jpg', '/images/col-necklaces-3.jpg'],
    variants: [{ name: 'Length', options: ['16"', '18"', '20"'] }],
  },
  {
    ...base, id: 'p8', slug: 'serpent-charm-anklet', name: 'Serpent Charm Anklet', category: 'anklets',
    description: longDesc('A delicate chain anklet with sparkling charms and a serpent clasp.'),
    price: 16.99, salePrice: 11.99, badge: 'New', bestSeller: false, stock: 32, sku: 'VEN-AN-001',
    images: ['/images/col-anklets.jpg', '/images/col-anklets-2.jpg', '/images/col-anklets-3.jpg'],
    variants: [{ name: 'Length', options: ['9"', '10"', '11"'] }],
  },
  {
    ...base, id: 'p9', slug: 'serpent-jewel-pendant-set', name: 'Serpent Jewel Pendant Set', category: 'jewelry-sets',
    description: longDesc('A matching necklace and earring set with leaf-cut drops and a central jewel.'),
    price: 39.99, salePrice: 29.99, badge: 'New', bestSeller: false, stock: 15, sku: 'VEN-ST-001',
    images: ['/images/col-sets.jpg', '/images/col-sets-2.jpg', '/images/col-sets-3.jpg'],
    variants: [],
  },
  {
    ...base, id: 'p10', slug: 'twin-serpent-drop-earrings', name: 'Twin Serpent Drop Earrings', category: 'earrings',
    description: longDesc('Long twin-serpent drops covered in sparkling stones for evening statements.'),
    price: 18.99, salePrice: 13.99, badge: null, bestSeller: false, stock: 45, sku: 'VEN-ER-002',
    images: ['/images/col-earrings.jpg', '/images/col-earrings-2.jpg', '/images/col-earrings-3.jpg'],
    variants: [],
  },
  {
    ...base, id: 'p11', slug: 'coil-serpent-bangle', name: 'Coil Serpent Bangle', category: 'bracelets',
    description: longDesc('A textured coil bangle that wraps the wrist in a knotted serpent design.'),
    price: 21.99, salePrice: 15.99, badge: null, bestSeller: false, stock: 22, sku: 'VEN-BR-002',
    images: ['/images/col-bracelets.jpg', '/images/col-bracelets-2.jpg', '/images/col-bracelets-3.jpg'],
    variants: [{ name: 'Size', options: ['Small', 'Medium', 'Large'] }],
  },
  {
    ...base, id: 'p12', slug: 'venora-timeless-statement-set', name: 'Venora Timeless Statement Set', category: 'jewelry-sets',
    description: longDesc('A statement choker and serpent drop earrings made to be worn together.'),
    price: 44.99, salePrice: 34.99, badge: 'Hot', bestSeller: false, stock: 12, sku: 'VEN-ST-002',
    images: ['/images/banner-model.jpg', '/images/banner-model-2.jpg', '/images/banner-model-3.jpg'],
    variants: [],
  },
];

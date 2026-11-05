import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCartMessage,
  buildProductMessage,
  generateOrderRef,
  money,
  normalizeWhatsapp,
  waLink,
} from '../src/lib/whatsapp';
import { addLine, setQty, removeLine, totals, parseLines, countItems, lineKey } from '../src/lib/cartMath';

test('normalizeWhatsapp handles international, 00 and local formats', () => {
  assert.equal(normalizeWhatsapp('+92 343 5295541'), '923435295541');
  assert.equal(normalizeWhatsapp('00923435295541'), '923435295541');
  assert.equal(normalizeWhatsapp('03435295541'), '923435295541');
});

test('waLink targets the configured number and encodes text', () => {
  const link = waLink('923435295541', 'Hello & welcome\nLine 2');
  assert.ok(link.startsWith('https://wa.me/923435295541?text='));
  const decoded = decodeURIComponent(link.split('?text=')[1]);
  assert.equal(decoded, 'Hello & welcome\nLine 2');
});

test('product message contains the actual product, price, qty, url and variant', () => {
  const msg = buildProductMessage({
    name: 'Colorful Woven Mesh Necklace',
    price: 12.99,
    quantity: 2,
    url: 'https://shop.test/product/colorful-woven-mesh-necklace',
    variant: 'Length: 18"',
  });
  assert.match(msg, /^Hello VENORA JEWELRY!/);
  assert.match(msg, /Product: Colorful Woven Mesh Necklace/);
  assert.match(msg, /Variant: Length: 18"/);
  assert.match(msg, /Price: \$12\.99/);
  assert.match(msg, /Quantity: 2/);
  assert.match(msg, /Product Link: https:\/\/shop\.test\/product\/colorful-woven-mesh-necklace/);
  assert.match(msg, /Please confirm availability and delivery details\./);
  assert.match(msg, /Thank you!$/);
});

test('no variant line when none chosen', () => {
  const msg = buildProductMessage({ name: 'Ring', price: 10, quantity: 1, url: 'u' });
  assert.doesNotMatch(msg, /Variant:/);
});

test('cart maths: add, merge, qty, remove, totals, shipping', () => {
  let lines = addLine([], { productId: 'a', slug: 'a', name: 'A', image: '', price: 12.99, qty: 1 });
  lines = addLine(lines, { productId: 'a', slug: 'a', name: 'A', image: '', price: 12.99, qty: 2 });
  lines = addLine(lines, { productId: 'a', slug: 'a', name: 'A', image: '', price: 12.99, qty: 1, variant: '18"' });
  assert.equal(lines.length, 2);
  assert.equal(lines[0].qty, 3);
  assert.equal(countItems(lines), 4);
  assert.deepEqual(totals(lines, { shippingFlat: 0, freeShippingOver: 0 }), { subtotal: 51.96, shipping: 0, total: 51.96 });
  assert.equal(totals(lines, { shippingFlat: 9.99, freeShippingOver: 0 }).total, 61.95);
  assert.equal(totals(lines, { shippingFlat: 9.99, freeShippingOver: 50 }).shipping, 0);
  lines = setQty(lines, lineKey('a'), 1);
  assert.equal(lines[0].qty, 1);
  lines = setQty(lines, lineKey('a'), 0);
  assert.equal(lines.length, 1);
  lines = removeLine(lines, lineKey('a', '18"'));
  assert.equal(lines.length, 0);
  assert.equal(totals([], { shippingFlat: 9.99, freeShippingOver: 0 }).total, 0);
});

test('parseLines survives corrupt storage', () => {
  assert.deepEqual(parseLines('not json'), []);
  assert.deepEqual(parseLines('{"a":1}'), []);
  assert.equal(parseLines(JSON.stringify([{ productId: 'x', price: 5, qty: 2, name: 'X' }])).length, 1);
});

test('cart message includes items, customer, totals and no confirmation claims', () => {
  const msg = buildCartMessage({
    ref: 'VEN-261104-ABCD',
    lines: [{ name: 'Snake Ring', price: 11.99, qty: 2, variant: 'Size 7', url: 'https://shop.test/product/snake-ring' }],
    customer: { name: 'Ayesha', whatsapp: '+92 300 1234567', country: 'Pakistan', city: 'Lahore', address: '12 Mall Road', notes: 'Gift wrap' },
    subtotal: 23.98,
    shipping: 0,
    total: 23.98,
  });
  assert.match(msg, /Order Ref:\* VEN-261104-ABCD/);
  assert.match(msg, /1\. Snake Ring \(Size 7\)/);
  assert.match(msg, /2 x \$11\.99 = \$23\.98/);
  assert.match(msg, /Shipping:\* Free/);
  assert.match(msg, /Total:\* \$23\.98/);
  assert.match(msg, /Name: Ayesha/);
  assert.match(msg, /Notes: Gift wrap/);
  assert.doesNotMatch(msg, /paid|confirmed order/i);
});

test('order ref format and money', () => {
  assert.match(generateOrderRef(new Date(2026, 10, 4), () => 0.5), /^VEN-261104-[0-9A-Z]{4}$/);
  assert.equal(money(9.999), '$10.00');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { csvCell, toCsv, filterOrders, statusCounts, computeKpis, dailySeries, stockAlerts, customersFrom, filterCustomers, filterProducts, safeBack, withNotice, statusMessage, dayKey, ordersCsv } from '../src/lib/adminTools';
import type { Order, Product } from '../src/lib/types';

const now = new Date('2026-11-06T08:00:00Z'); // 13:00 in Karachi
const mkOrder = (o: Partial<Order>): Order => ({
  id: 'x', orderNumber: 'VEN-1', source: 'whatsapp-cart', status: 'Pending', customerName: 'Ayesha', whatsapp: '+92 300 1112223', country: 'Pakistan', city: 'Lahore',
  address: 'Street 1\nArea', notes: '', adminNotes: '', items: [{ productId: 'p1', slug: 's', name: 'Ring', price: 10, qty: 2 }], subtotal: 20, shipping: 0, total: 20, currency: 'USD',
  createdAt: '2026-11-06T06:00:00Z', ...o,
});
const mkProduct = (p: Partial<Product>): Product => ({
  id: 'p', slug: 'ring', name: 'Ring', category: 'rings', description: '', price: 10, salePrice: null, images: [], variants: [], variantCombinations: [], stock: 5, status: 'active', badge: null, rating: null, reviewCount: 0, bestSeller: false, sku: 'R1', createdAt: '2026-11-01T00:00:00Z', ...p,
});

test('csvCell escapes quotes/commas/newlines and blocks formula injection', () => {
  assert.equal(csvCell('a,b'), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell('=SUM(A1)'), "'=SUM(A1)");
  assert.equal(csvCell('@cmd'), "'@cmd");
  assert.equal(csvCell('-abc'), "'-abc");
  assert.equal(csvCell('+92 300 1112223'), '+92 300 1112223');
  assert.equal(csvCell(-5), '-5');
  assert.equal(csvCell(null), '');
  assert.ok(toCsv(['a'], [['1']]).startsWith('﻿a\r\n1'));
});

test('dayKey uses the Karachi day, not UTC', () => {
  assert.equal(dayKey('2026-11-05T20:30:00Z'), '2026-11-06'); // 01:30 next day in Karachi
});

test('filterOrders: search by number, name, phone digits; date range; status', () => {
  const a = mkOrder({ id: '1', orderNumber: 'VEN-AAA', customerName: 'Ayesha' });
  const b = mkOrder({ id: '2', orderNumber: 'VEN-BBB', customerName: 'Zara', whatsapp: '923331234567', status: 'Shipped', createdAt: '2026-10-01T06:00:00Z' });
  const all = [a, b];
  assert.deepEqual(filterOrders(all, { q: 'ven-bbb' }).map((o) => o.id), ['2']);
  assert.deepEqual(filterOrders(all, { q: 'ayesha' }).map((o) => o.id), ['1']);
  assert.deepEqual(filterOrders(all, { q: '0333 1234567' }).map((o) => o.id), []); // spaces/0 prefix not substring-matched on digits
  assert.deepEqual(filterOrders(all, { q: '3331234' }).map((o) => o.id), ['2']);
  assert.deepEqual(filterOrders(all, { status: 'Shipped' }).map((o) => o.id), ['2']);
  assert.deepEqual(filterOrders(all, { from: '2026-11-01' }).map((o) => o.id), ['1']);
  assert.deepEqual(filterOrders(all, { to: '2026-10-31' }).map((o) => o.id), ['2']);
  assert.deepEqual(filterOrders(all, { status: 'Shipped' }, { ignoreStatus: true }).length, 2);
  assert.deepEqual(statusCounts(all), { Pending: 1, Shipped: 1 });
});

test('computeKpis: today/week/month, growth, pending & stale, cancelled excluded', () => {
  const orders = [
    mkOrder({ id: '1', total: 100, createdAt: '2026-11-06T05:00:00Z' }), // today
    mkOrder({ id: '2', total: 50, status: 'Delivered', createdAt: '2026-11-02T05:00:00Z' }), // this week
    mkOrder({ id: '3', total: 30, status: 'Delivered', createdAt: '2026-10-20T05:00:00Z' }), // this month
    mkOrder({ id: '4', total: 40, status: 'Delivered', createdAt: '2026-09-25T05:00:00Z' }), // previous 30 days
    mkOrder({ id: '5', total: 999, status: 'Cancelled', createdAt: '2026-11-06T05:00:00Z' }),
  ];
  const k = computeKpis(orders, now);
  assert.equal(k.today.revenue, 100);
  assert.equal(k.week.revenue, 150);
  assert.equal(k.month.revenue, 180);
  assert.equal(k.prev.revenue, 40);
  assert.equal(Math.round(k.growth!), 350);
  assert.equal(k.pendingCount, 1);
  assert.equal(k.stale.length, 0);
  assert.equal(Math.round(k.aov), 55);
  assert.equal(computeKpis([mkOrder({ createdAt: '2026-11-03T00:00:00Z' })], now).stale.length, 1);
  assert.equal(computeKpis([], now).growth, null);
});

test('dailySeries has one slot per day and sums revenue', () => {
  const s = dailySeries([mkOrder({ total: 20 }), mkOrder({ total: 5 })], 14, now);
  assert.equal(s.length, 14);
  assert.equal(s[13].day, '2026-11-06');
  assert.equal(s[13].revenue, 25);
  assert.equal(s[13].orders, 2);
});

test('stockAlerts splits out-of-stock and low-stock for active products only', () => {
  const a = stockAlerts([mkProduct({ id: '1', stock: 0 }), mkProduct({ id: '2', stock: 2 }), mkProduct({ id: '3', stock: 9 }), mkProduct({ id: '4', stock: 0, status: 'draft' })]);
  assert.deepEqual(a.out.map((p) => p.id), ['1']);
  assert.deepEqual(a.low.map((p) => p.id), ['2']);
});

test('customersFrom groups by phone number and ignores cancelled in totals', () => {
  const rows = customersFrom([
    mkOrder({ id: '1', whatsapp: '+92 300 1112223', total: 20, createdAt: '2026-10-01T00:00:00Z' }),
    mkOrder({ id: '2', whatsapp: '923001112223', total: 30, customerName: 'Ayesha K', createdAt: '2026-10-05T00:00:00Z' }),
    mkOrder({ id: '3', whatsapp: '0300 1112223', customerName: 'Ayesha K', total: 500, status: 'Cancelled', createdAt: '2026-10-06T00:00:00Z' }),
    mkOrder({ id: '4', whatsapp: '923331234567', customerName: 'Zara', total: 10 }),
  ]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].spent, 50);
  assert.equal(rows[0].orders, 2);
  assert.equal(rows[0].name, 'Ayesha K');
  assert.equal(filterCustomers(rows, 'zara').length, 1);
  assert.equal(filterCustomers(rows, '').length, 2);
});

test('filterProducts filters and sorts', () => {
  const ps = [
    mkProduct({ id: '1', name: 'B Ring', price: 20, stock: 0, category: 'rings', createdAt: '2026-11-01T00:00:00Z' }),
    mkProduct({ id: '2', name: 'A Necklace', price: 10, salePrice: 5, stock: 2, category: 'necklaces', sku: 'N9', createdAt: '2026-11-03T00:00:00Z' }),
    mkProduct({ id: '3', name: 'C Anklet', price: 15, stock: 20, status: 'draft', category: 'anklets', createdAt: '2026-11-02T00:00:00Z' }),
  ];
  assert.deepEqual(filterProducts(ps, {}).map((p) => p.id), ['2', '3', '1']);
  assert.deepEqual(filterProducts(ps, { sort: 'name' }).map((p) => p.id), ['2', '1', '3']);
  assert.deepEqual(filterProducts(ps, { sort: 'price-asc' }).map((p) => p.id), ['2', '3', '1']);
  assert.deepEqual(filterProducts(ps, { stock: 'out' }).map((p) => p.id), ['1']);
  assert.deepEqual(filterProducts(ps, { stock: 'low' }).map((p) => p.id), ['2']);
  assert.deepEqual(filterProducts(ps, { status: 'draft' }).map((p) => p.id), ['3']);
  assert.deepEqual(filterProducts(ps, { category: 'rings' }).map((p) => p.id), ['1']);
  assert.deepEqual(filterProducts(ps, { q: 'n9' }).map((p) => p.id), ['2']);
});

test('safeBack only allows /admin paths; withNotice keeps other params', () => {
  assert.equal(safeBack('/admin/orders?status=Pending', '/admin'), '/admin/orders?status=Pending');
  assert.equal(safeBack('https://evil.com', '/admin'), '/admin');
  assert.equal(safeBack('//evil.com', '/admin'), '/admin');
  assert.equal(safeBack('/administrator', '/admin'), '/admin');
  assert.equal(safeBack('/admin\\evil', '/admin'), '/admin');
  assert.equal(safeBack(undefined, '/admin/x'), '/admin/x');
  assert.equal(withNotice('/admin/orders?status=Pending&notice=old', 'notice', 'Saved'), '/admin/orders?status=Pending&notice=Saved');
  assert.equal(withNotice('/admin/orders', 'error', 'Bad thing'), '/admin/orders?error=Bad+thing');
});

test('statusMessage and ordersCsv include the order reference and neutralise odd cells', () => {
  const o = mkOrder({ orderNumber: 'VEN-XYZ', total: 42.5, customerName: '=cmd' });
  assert.ok(statusMessage(o, 'confirm', 'VENORA JEWELRY', '$').includes('VEN-XYZ'));
  assert.ok(statusMessage(o, 'shipped', 'VENORA JEWELRY', '$').includes('shipped'));
  const csv = ordersCsv([o]);
  assert.ok(csv.includes("'=cmd"));
  assert.ok(csv.includes('2 x Ring'));
});

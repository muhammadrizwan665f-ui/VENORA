import type { Metadata } from 'next';
import CartView from '@/components/CartView';
import PageHero from '@/components/PageHero';

export const metadata: Metadata = { title: 'Shopping Cart', robots: { index: false }, alternates: { canonical: '/cart' } };

export default function CartPage() {
  return (
    <>
      <PageHero eyebrow="Your selection" title="Shopping Cart" />
      <CartView />
    </>
  );
}

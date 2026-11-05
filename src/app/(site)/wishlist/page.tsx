import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import WishlistView from '@/components/WishlistView';

export const metadata: Metadata = { title: 'Wishlist', robots: { index: false }, alternates: { canonical: '/wishlist' } };

export default function WishlistPage() {
  return (
    <>
      <PageHero eyebrow="Saved for later" title="Your Wishlist" />
      <WishlistView />
    </>
  );
}

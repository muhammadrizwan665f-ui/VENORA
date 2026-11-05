import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import TrackForm from '@/components/TrackForm';

export const metadata: Metadata = { title: 'Track Your Order', description: 'Check the status of your VENORA JEWELRY order.', alternates: { canonical: '/track-order' } };

export default function TrackOrderPage() {
  return (
    <>
      <PageHero eyebrow="Where is my piece?" title="Track Order">
        Enter your order reference and the WhatsApp number you ordered with.
      </PageHero>
      <section className="container-x py-12"><TrackForm /></section>
    </>
  );
}

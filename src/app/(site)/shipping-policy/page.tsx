import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Shipping Policy', description: 'Worldwide shipping, luxury packaging and delivery information from VENORA JEWELRY.', alternates: { canonical: '/shipping-policy' } };

export default function ShippingPolicy() {
  return (
    <LegalPage title="Shipping Policy" eyebrow="Delivered with care">
      <h2>Worldwide shipping</h2>
      <p>We ship to most countries around the world. Shipping charges, if any, are shown in your cart and confirmed with you on WhatsApp before your order is finalised.</p>
      <h2>Luxury packaging</h2>
      <p>Every order is wrapped in complimentary VENORA luxury packaging.</p>
      <h2>Processing and delivery times</h2>
      <ul>
        <li>Orders are processed after we confirm availability, delivery details and payment with you on WhatsApp.</li>
        <li>Delivery time depends on your country and the courier. We will give you an estimate when we confirm your order.</li>
        <li>You will receive tracking details, where available, on WhatsApp once your order ships.</li>
      </ul>
      <h2>Delivery details</h2>
      <p>Please provide a complete and accurate delivery address and a working WhatsApp number. We are not responsible for delays caused by incorrect details.</p>
      <h2>Customs and import duties</h2>
      <p>Depending on your country, customs duties or import taxes may apply on delivery. These are set by local authorities and are the buyer’s responsibility.</p>
      <h2>Questions?</h2>
      <p>Message us on WhatsApp from the <a href="/contact">Contact page</a>.</p>
    </LegalPage>
  );
}

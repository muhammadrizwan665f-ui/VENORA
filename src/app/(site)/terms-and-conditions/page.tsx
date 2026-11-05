import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Terms & Conditions', description: 'Terms of use and sale for VENORA JEWELRY.', alternates: { canonical: '/terms-and-conditions' } };

export default function Terms() {
  return (
    <LegalPage title="Terms & Conditions" eyebrow="The fine print" updated="November 2026">
      <h2>Using this website</h2>
      <p>By using this website you agree to these terms. Content, images and designs belong to VENORA JEWELRY and may not be copied without permission.</p>
      <h2>Ordering</h2>
      <ul>
        <li>Orders are placed by sending a message to us on WhatsApp. Sending a message is a request to buy, not a confirmed order.</li>
        <li>An order is confirmed only when we reply to confirm availability, the final total and delivery details. Nothing is automatically confirmed or paid through this website.</li>
        <li>We may decline or cancel an order, for example if an item is unavailable or details cannot be verified.</li>
      </ul>
      <h2>Prices</h2>
      <p>Prices are shown in the store currency and may change without notice. The total confirmed with you on WhatsApp is the price you pay.</p>
      <h2>Payment</h2>
      <p>Payment options are shared on WhatsApp after confirmation. Goods ship after payment is received.</p>
      <h2>Shipping and returns</h2>
      <p>See our <a href="/shipping-policy">Shipping Policy</a> and <a href="/return-policy">Return Policy</a>.</p>
      <h2>Product images</h2>
      <p>We try to show our jewelry accurately; colours and sparkle may vary slightly between screens and in person.</p>
      <h2>Liability</h2>
      <p>To the extent permitted by law, VENORA JEWELRY is not liable for indirect or consequential losses arising from the use of this website.</p>
      <h2>Contact</h2>
      <p>Questions about these terms? Reach us on WhatsApp from the <a href="/contact">Contact page</a>.</p>
    </LegalPage>
  );
}

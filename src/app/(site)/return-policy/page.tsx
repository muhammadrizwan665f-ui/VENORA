import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Return Policy', description: 'Easy returns and exchanges for VENORA JEWELRY orders.', alternates: { canonical: '/return-policy' } };

export default function ReturnPolicy() {
  return (
    <LegalPage title="Return Policy" eyebrow="Peace of mind">
      <h2>30-day easy returns</h2>
      <p>If you are not delighted with your piece, message us on WhatsApp within 30 days of delivery and we will arrange a return or exchange.</p>
      <h2>Conditions</h2>
      <ul>
        <li>The item must be unworn, undamaged and in its original packaging.</li>
        <li>Custom, personalised or clearance items are final sale unless faulty.</li>
        <li>Earrings are non-returnable for hygiene reasons unless faulty.</li>
      </ul>
      <h2>Faulty or incorrect items</h2>
      <p>If your item arrives damaged or is not what you ordered, send us photos on WhatsApp within 7 days of delivery and we will make it right.</p>
      <h2>How to start a return</h2>
      <ul>
        <li>Message us on WhatsApp with your order reference and the reason for the return.</li>
        <li>We will confirm the return address and the next steps.</li>
        <li>Once the item is received and inspected, we process your exchange or refund using the original payment method where possible.</li>
      </ul>
      <p>Return shipping costs are the customer’s responsibility unless the item is faulty or incorrect.</p>
    </LegalPage>
  );
}

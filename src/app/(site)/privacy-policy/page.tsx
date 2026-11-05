import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Privacy Policy', description: 'How VENORA JEWELRY collects, uses and protects your personal information.', alternates: { canonical: '/privacy-policy' } };

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" eyebrow="Your privacy matters" updated="November 2026">
      <p>This policy explains what information VENORA JEWELRY collects and how we use it.</p>
      <h2>Information we collect</h2>
      <ul>
        <li><strong>Order details</strong> you provide at checkout: name, WhatsApp number, country, city, delivery address and notes. These are included in the WhatsApp message you send us and may be recorded in our order system so we can fulfil and track your order.</li>
        <li><strong>Newsletter email</strong>, if you subscribe.</li>
        <li><strong>Cart and wishlist</strong> are stored only in your own browser (local storage) and are not sent to us until you order.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To confirm, deliver and support your order.</li>
        <li>To send newsletters you opted into (you can opt out at any time).</li>
        <li>To prevent fraud and keep the site secure.</li>
      </ul>
      <h2>WhatsApp</h2>
      <p>When you choose to order on WhatsApp you are leaving this website and communicating through WhatsApp, which is governed by its own terms and privacy policy.</p>
      <h2>Payments</h2>
      <p>This website does not collect card or payment details.</p>
      <h2>Sharing</h2>
      <p>We do not sell your information. We share it only with couriers and service providers needed to deliver your order and run this website, or where the law requires.</p>
      <h2>Your choices</h2>
      <p>You may ask to access, correct or delete your information at any time by messaging us on WhatsApp.</p>
    </LegalPage>
  );
}

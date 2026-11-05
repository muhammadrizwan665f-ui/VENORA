import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import { ChevronDown } from '@/components/Icons';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Answers about ordering on WhatsApp, payment, shipping, returns and jewelry care at VENORA JEWELRY.',
  alternates: { canonical: '/faq' },
};

const faqs: [string, string][] = [
  ['How do I place an order?', 'Tap “Order on WhatsApp” on any piece, or add items to your cart and choose “Checkout via WhatsApp”. WhatsApp opens with your order already written; press Send and we take it from there.'],
  ['Is my order confirmed when I send the message?', 'No. Your order is only confirmed after we reply on WhatsApp to confirm availability, your delivery details and the final total. Nothing is charged or marked as paid automatically.'],
  ['How do I pay?', 'We share the available payment options with you on WhatsApp once your order is confirmed. We never ask for card details on this website.'],
  ['Do you ship worldwide?', 'Yes. We offer free worldwide shipping, and every order arrives in our luxury packaging. See our Shipping Policy for details.'],
  ['How can I track my order?', 'Use the Track Order page with your order reference (shown in your WhatsApp message) and the WhatsApp number you ordered with, or simply message us.'],
  ['Can I return or exchange a piece?', 'Please read our Return Policy for the conditions and time window. Message us on WhatsApp and we will guide you through it.'],
  ['How do I choose my size?', 'Rings, bracelets, anklets and chains list their size or length options on each product page. If you are unsure, message us on WhatsApp and we will help you choose.'],
  ['How should I care for my jewelry?', 'Keep it dry, put it on after perfume and lotion, and store each piece separately in its pouch or box. Wipe gently with a soft cloth.'],
];

export default function FaqPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <PageHero eyebrow="Good to know" title="Frequently Asked Questions" />
      <section className="container-x max-w-3xl py-12">
        <div className="divide-y divide-gold/20 rounded-2xl border border-gold/30 bg-coal">
          {faqs.map(([q, a]) => (
            <details key={q} className="group px-5 py-1 sm:px-7">
              <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg text-ivory marker:hidden hover:text-gold [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDown className="shrink-0 text-gold transition group-open:rotate-180" />
              </summary>
              <p className="pb-5 text-[15px] leading-relaxed text-ivory/75">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

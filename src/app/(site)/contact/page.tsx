import type { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import PageHero from '@/components/PageHero';
import { WhatsAppIcon } from '@/components/Icons';
import { getSettings } from '@/lib/data';
import { waLink } from '@/lib/whatsapp';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Message VENORA JEWELRY on WhatsApp for orders, sizing help, delivery questions and gifting.',
  alternates: { canonical: '/contact' },
};

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <>
      <PageHero eyebrow="We’re here to help" title="Contact Us">
        The fastest way to reach us is WhatsApp. Ask about a piece, sizing, delivery or gifting.
      </PageHero>
      <section className="container-x grid gap-10 py-14 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="font-serif text-3xl text-gold">Talk to us</h2>
          <a
            href={waLink(s.whatsappNumber, 'Hello VENORA JEWELRY! I have a question.')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold mt-6 !min-h-[54px] w-full sm:w-auto"
          >
            <WhatsAppIcon width={20} height={20} /> Chat on WhatsApp
          </a>
          <dl className="mt-8 space-y-4 text-[15px]">
            <div><dt className="label-lux">WhatsApp</dt><dd>{s.phone || `+${s.whatsappNumber}`}</dd></div>
            {s.email && <div><dt className="label-lux">Email</dt><dd><a className="text-gold underline underline-offset-4" href={`mailto:${s.email}`}>{s.email}</a></dd></div>}
            {s.address && <div><dt className="label-lux">Studio</dt><dd className="whitespace-pre-line">{s.address}</dd></div>}
          </dl>
        </div>
        <div className="rounded-2xl border border-gold/30 bg-coal p-6 sm:p-8">
          <h2 className="mb-5 font-serif text-2xl text-ivory">Send a message</h2>
          <ContactForm />
        </div>
      </section>
    </>
  );
}

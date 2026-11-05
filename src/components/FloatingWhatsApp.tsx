'use client';

import { useStore } from './StoreProvider';
import { WhatsAppIcon } from './Icons';
import { waLink } from '@/lib/whatsapp';

/** General enquiry button (product-specific ordering lives on each product card / page). */
export default function FloatingWhatsApp() {
  const { settings } = useStore();
  return (
    <a
      href={waLink(settings.whatsappNumber, 'Hello VENORA JEWELRY! I have a question about your jewelry.')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with VENORA JEWELRY on WhatsApp"
      className="fixed bottom-4 right-4 z-[80] grid h-14 w-14 place-items-center rounded-full text-ink shadow-[0_10px_30px_-6px_rgb(var(--c-gold)/0.7)] transition hover:scale-110 sm:bottom-6 sm:right-6"
      style={{ background: 'linear-gradient(135deg,rgb(var(--c-gold-light)),rgb(var(--c-gold)) 45%,rgb(var(--c-gold-deep)))' }}
    >
      <WhatsAppIcon width={28} height={28} />
    </a>
  );
}

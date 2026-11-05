const messages = ['Free Worldwide Shipping', 'Luxury Packaging Included', 'Exclusive Jewelry Collection'];

const Spark = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" style={{ fill: 'rgb(var(--c-gold))' }} aria-hidden="true" className="shrink-0">
    <path d="M12 1.5 14 9l7.5 3L14 15l-2 7.5L10 15l-7.5-3L10 9l2-7.5Z" />
  </svg>
);

export default function AnnouncementBar() {
  return (
    <div className="relative z-[60] overflow-hidden border-b border-gold/20 bg-ink text-[11px] tracking-wide text-ivory sm:text-xs" role="region" aria-label="Store announcements">
      {/* ≥ sm: static, centred */}
      <ul className="mx-auto hidden h-9 items-center justify-center gap-4 sm:flex">
        {messages.map((m, i) => (
          <li key={m} className="flex items-center gap-4">
            {i === 0 && <Spark />}
            <span>{m}</span>
            {i < messages.length - 1 ? <span className="text-gold/50">|</span> : <Spark />}
          </li>
        ))}
      </ul>
      {/* mobile: marquee */}
      <div className="flex h-9 items-center sm:hidden">
        <div className="flex w-max animate-marquee items-center gap-8 whitespace-nowrap pr-8">
          {[...messages, ...messages, ...messages, ...messages].map((m, i) => (
            <span key={i} className="flex items-center gap-8">
              <span>{m}</span>
              <Spark />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

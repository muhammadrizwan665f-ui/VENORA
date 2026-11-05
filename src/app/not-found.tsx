import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink px-6 text-center">
      <div>
        <p className="gold-text font-display text-7xl">404</p>
        <h1 className="mt-4 font-serif text-3xl text-ivory">This page has slipped away.</h1>
        <p className="mt-2 text-mute">The piece or page you are looking for does not exist.</p>
        <Link href="/" className="btn-gold mt-8">Back to Venora</Link>
      </div>
    </div>
  );
}

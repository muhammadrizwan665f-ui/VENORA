/** Success / error banner driven by ?notice= and ?error= (set by admin server actions). */
export default function Notice({ notice, error }: { notice?: string; error?: string }) {
  if (error) {
    return <p role="alert" className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>;
  }
  if (notice) {
    return <p role="status" className="rounded-lg border border-gold/50 bg-gold/10 px-4 py-3 text-sm text-gold">{notice}</p>;
  }
  return null;
}

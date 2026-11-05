import Image from 'next/image';

const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : '';
  } catch {
    return '';
  }
})();

const optimizable = (src: string) => src.startsWith('/') || (!!supabaseHost && src.includes(supabaseHost));

type Props = {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

/** Fills its (relatively positioned) parent. Uses next/image for local + Supabase images, plain <img> for any other host. */
export default function SmartImage({ src, alt, sizes = '100vw', priority, className = '' }: Props) {
  if (optimizable(src)) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} className={`absolute inset-0 h-full w-full ${className}`} />;
}

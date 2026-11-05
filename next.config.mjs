/** @type {import('next').NextConfig} */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const collections = ['necklaces', 'bracelets', 'rings', 'earrings', 'anklets', 'jewelry-sets'];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  images: {
    // Cloudflare Workers has no built-in image optimiser; images are served as-is (still lazy-loaded).
    // To re-enable, add a Cloudflare Images binding and remove this line.
    unoptimized: true,
    remotePatterns: supabaseHost
      ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }]
      : [],
  },
  // Friendly category URLs: /necklaces -> /collections/necklaces
  async rewrites() {
    return collections.map((c) => ({ source: `/${c}`, destination: `/collections/${c}` }));
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;

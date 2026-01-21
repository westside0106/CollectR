import type { NextConfig } from "next";

// Get Supabase hostname from environment variable
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oferxxqoeshilqhwtyqf.supabase.co'
const supabaseHostname = supabaseUrl.replace('https://', '').replace('http://', '')

const nextConfig: NextConfig = {
  // Turbopack Config (Next.js 16+)
  turbopack: {},

  // Security Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ]
  },

  // Bilder von Supabase Storage erlauben
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;

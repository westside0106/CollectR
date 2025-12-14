import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack Config (Next.js 16+)
  turbopack: {},
  
  // Bilder von Supabase Storage erlauben
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oferxxqoeshilqhwtyqf.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;

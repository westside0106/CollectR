import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack Config (Next.js 16+)
  turbopack: {},

  // Force cache invalidation
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },

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

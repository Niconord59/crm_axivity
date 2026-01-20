import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Output standalone pour Docker/Coolify
  output: 'standalone',
  turbopack: {
    root: __dirname,
  },
  // Minimiser le Router Cache RSC pour éviter les données stales
  // https://nextjs.org/docs/app/api-reference/next-config-js/staleTimes
  experimental: {
    staleTimes: {
      dynamic: 0,   // Pas de cache pour les pages dynamiques
      static: 30,   // Minimum 30s requis par Next.js pour les pages statiques
    },
  },
  // Configuration images pour Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'supabase.axivity.cloud',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;

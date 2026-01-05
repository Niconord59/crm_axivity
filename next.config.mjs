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

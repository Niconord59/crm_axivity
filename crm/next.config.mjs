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
  // ============================================================================
  // Security Headers (P3-01)
  // ============================================================================
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '0',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://supabase.axivity.cloud",
              "font-src 'self' data:",
              "connect-src 'self' https://supabase.axivity.cloud wss://supabase.axivity.cloud https://recherche-entreprises.api.gouv.fr https://places.googleapis.com https://maps.googleapis.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

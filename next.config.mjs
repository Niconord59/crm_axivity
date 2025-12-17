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
};

export default nextConfig;

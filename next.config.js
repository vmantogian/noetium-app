/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
      },
    ],
  },
  // serverActions is now enabled by default in Next.js 14, no need to specify
  experimental: {
    // Add any other experimental features here if needed
  },
};

module.exports = nextConfig;

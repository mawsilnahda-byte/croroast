/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.thum.io',
      },
      {
        protocol: 'https',
        hostname: '*.microlink.io',
      },
      {
        protocol: 'https',
        hostname: 'microlink.io',
      },
    ],
  },
  // Treat puppeteer-core and chromium as server-only external packages
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min'],
};

export default nextConfig;

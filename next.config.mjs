/** @type {import('next').NextConfig} */

// Turn off console logs in production
const isProd = process.env.NODE_ENV === 'production';
if (isProd) {
  console.log('Production build: Disabling all console logs');
} else {
  console.log('Development build: Console logs are enabled');
}

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media-cdn.tripadvisor.com',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true, // This allows the build to proceed despite TypeScript errors
  },
  eslint: {
    ignoreDuringBuilds: true, // This disables ESLint during the build step
  },
  // Conditionally include the removeConsole option based on the environment
  ...(isProd && {
    compiler: {
      removeConsole: true,
    },
  }),
};


export default nextConfig;

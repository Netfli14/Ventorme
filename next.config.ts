import type { NextConfig } from 'next';
const config: NextConfig = {
  distDir: process.env.VENTORME_TEST_DIST_DIR || '.next',
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : 'https://ventorme1.vercel.app'),
  },
};
export default config;

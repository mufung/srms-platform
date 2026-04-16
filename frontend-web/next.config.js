 /** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: [
      'srms-master-assets.s3.amazonaws.com',
      'srms-master-assets.s3.us-east-1.amazonaws.com',
    ],
    formats: ['image/avif', 'image/webp'],
  },

  env: {
    NEXT_PUBLIC_PLATFORM_NAME: process.env.NEXT_PUBLIC_PLATFORM_NAME || 'SRMS Platform',
    NEXT_PUBLIC_OWNER_NAME: 'MUFUNG ANGELBELL MBUYEH',
    NEXT_PUBLIC_OWNER_EMAIL: 'mufungangelbellmbuyeh@gmail.com',
    NEXT_PUBLIC_OWNER_WHATSAPP: '+237671534067',
    NEXT_PUBLIC_OWNER_LATITUDE: '3.8480',
    NEXT_PUBLIC_OWNER_LONGITUDE: '11.5021',
    NEXT_PUBLIC_OWNER_LOCATION: 'Yaoundé, Cameroon Northwest',
    NEXT_PUBLIC_OWNER_TITLE: 'AWS Solutions Architect',
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

module.exports = nextConfig;
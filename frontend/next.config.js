/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/admin/usuarios',
        destination: '/usuarios',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/usuarios',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;

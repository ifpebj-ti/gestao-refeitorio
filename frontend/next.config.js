function buildTvCacheHeaders() {
  return [
    {
      key: "Cache-Control",
      value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
    },
  ];
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/tv",
        headers: buildTvCacheHeaders(),
      },
      {
        source: "/tv/:path*",
        headers: buildTvCacheHeaders(),
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/admin/usuarios",
        destination: "/usuarios",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/usuarios",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;

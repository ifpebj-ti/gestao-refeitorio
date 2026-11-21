function buildSecurityHeaders() {
  return [
    // A CSP possui uma única fonte de verdade no Nginx. Emiti-la também aqui
    // cria a interseção de duas políticas e pode bloquear a hidratação do Next.js.
    {
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    },
    {
      key: "X-Frame-Options",
      value: "SAMEORIGIN",
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
  ];
}

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
      {
        source: "/(.*)",
        headers: buildSecurityHeaders(),
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

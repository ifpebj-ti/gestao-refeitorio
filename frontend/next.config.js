function extrairOrigemApiConfigurada() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  if (apiUrl.startsWith("http://") || apiUrl.startsWith("https://")) {
    try {
      const parsed = new URL(apiUrl);
      if (parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
        return parsed.origin;
      }
    } catch {}
  }
  return null;
}

function buildCspHeader() {
  const isDev = process.env.NODE_ENV !== "production";
  const origemApiExterna = extrairOrigemApiConfigurada();

  const scriptSrc = [
    "'self'",
    ...(isDev ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
    "https://accounts.google.com",
    "https://apis.google.com",
  ].join(" ");

  const imgSrc = [
    "'self'",
    "data:",
    "blob:",
    "https://*.googleusercontent.com",
    ...(origemApiExterna ? [origemApiExterna] : []),
    ...(isDev ? ["http://localhost:8080"] : []),
  ].join(" ");

  const connectSrc = [
    "'self'",
    "https://accounts.google.com",
    "https://apis.google.com",
    "https://oauth2.googleapis.com",
    ...(origemApiExterna ? [origemApiExterna] : []),
    ...(isDev ? ["http://localhost:8080"] : []),
  ].join(" ");

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://accounts.google.com",
    `img-src ${imgSrc}`,
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src ${connectSrc}`,
    "frame-src 'self' https://accounts.google.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

function buildSecurityHeaders() {
  return [
    {
      key: "Content-Security-Policy",
      value: buildCspHeader(),
    },
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

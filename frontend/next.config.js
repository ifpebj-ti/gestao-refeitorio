function buildCspHeader() {
  const isDev = process.env.NODE_ENV !== "production";
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'"] : []),
    "https://accounts.google.com",
    "https://apis.google.com",
  ].join(" ");

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://accounts.google.com",
    "img-src 'self' data: blob: https://*.googleusercontent.com http://localhost:8080 https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' http://localhost:8080 https://accounts.google.com https://oauth2.googleapis.com https:",
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: buildSecurityHeaders(),
      },
    ];
  },
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

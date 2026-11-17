/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8001/api/:path*",
      },
      {
        source: "/ws",
        destination: "http://localhost:8001/ws",
      },
    ];
  },
  // Allow export for gateway static serve if needed
  // output: "export", // uncomment to generate out/ for gateway
};

module.exports = nextConfig;

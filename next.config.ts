import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.NODE_ENV === "development" && {
    allowedDevOrigins: ["192.168.100.240"],
  }),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "connect-src 'self' wss://0.peerjs.com https://0.peerjs.com; " +
              "img-src 'self' data:; " +
              "font-src 'self' data:; " +
              "frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

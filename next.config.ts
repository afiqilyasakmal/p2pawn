import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.NODE_ENV === "development" && {
    allowedDevOrigins: ["192.168.100.240"],
  }),
};

export default nextConfig;


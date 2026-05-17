import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  experimental: {
    turbopack: {},
  },
  rewrites: async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.116:3002";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
  // Fix for Next.js blocking cross-origin dev requests from mobile
  allowedDevOrigins: ["localhost:3003", "192.168.1.115", "192.168.1.115:3003", "*"],
};

export default withPWA(nextConfig);

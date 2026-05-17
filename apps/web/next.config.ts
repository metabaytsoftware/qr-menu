import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;

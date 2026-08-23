import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  rewrites: async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.116:3002";
    console.log("👉 [Next.js Rewrite] NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL, "-> Target URL:", apiUrl);
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

export default withSentryConfig(nextConfig, {
  org: "metabayt",
  project: "javascript-nextjs",
  authToken: process.env.SENTRY_AUTH_TOKEN,

  widenClientFileUpload: true,

  // Proxy error events through Next.js to bypass ad-blockers
  tunnelRoute: "/monitoring",

  silent: !process.env.CI,
});

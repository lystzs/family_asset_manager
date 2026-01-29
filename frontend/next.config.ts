import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
  async rewrites() {
    // These rewrites only work on the Next.js server (not in browser)
    // The backend URL should never be exposed to the client
    const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://backend:8000";

    return [
      {
        source: "/api/proxy/:path*",
        destination: `${backendUrl}/:path*`,
      },
      {
        source: "/ws/:path*",
        destination: `${backendUrl}/ws/:path*`,
      }
    ];
  },
};

export default nextConfig;

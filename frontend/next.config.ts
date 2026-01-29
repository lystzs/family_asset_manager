import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  output: "standalone",
  trailingSlash: true, // Needed for FastAPI compatibility (prevents 308 redirects that strip slashes)
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
};


export default nextConfig;

import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
const apiUrl = process.env.API_URL || (isProduction ? undefined : "http://127.0.0.1:8000");

if (isProduction && !publicApiUrl && !apiUrl) {
  throw new Error("Set API_URL or NEXT_PUBLIC_API_URL to configure the backend in production.");
}

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    if (!apiUrl) return [];

    return [{ source: "/api/:path*", destination: `${apiUrl}/:path*` }];
  },
};

export default nextConfig;
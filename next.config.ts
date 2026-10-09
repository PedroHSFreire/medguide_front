import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Serwist injects webpack config; Next 16 defaults to Turbopack in `next dev`.
  turbopack: {},
};

export default withSerwist(nextConfig);

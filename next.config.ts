import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Lets other devices on the local network (e.g. a phone at 192.168.x.x) use the dev server
  allowedDevOrigins: ["192.168.*.*"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

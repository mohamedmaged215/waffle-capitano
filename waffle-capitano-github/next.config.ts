import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.109"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gzkjladvhhntmzigyorv.supabase.co",
        pathname: "/storage/v1/object/public/dessert-products/**",
      },
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;

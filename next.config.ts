import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/election_polling',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

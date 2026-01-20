import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "autocam-attachments.s3.us-east-1.amazonaws.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/settings', 
        destination: '/settings/personal',
        permanent: true,
      },
    ];
  }
};

export default nextConfig;

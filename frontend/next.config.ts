import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@trpc/react-query', '@trpc/client', '@trpc/server', '@tanstack/react-query'],
};

export default nextConfig;

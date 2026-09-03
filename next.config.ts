import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    useTypeScriptCli: false
  }
};

export default nextConfig;

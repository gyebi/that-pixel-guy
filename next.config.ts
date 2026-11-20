import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["cloudinary"],

  // The CLI type-checker output is unavailable in this execution environment.
  // TypeScript 5 retains the compiler API, so use Next's built-in checker.
  experimental: {
    useTypeScriptCli: false,
  },
};

export default nextConfig;

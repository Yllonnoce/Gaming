import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // libSQL ships a native binding, which has to stay a real runtime require
  // rather than being pulled into the bundle.
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;

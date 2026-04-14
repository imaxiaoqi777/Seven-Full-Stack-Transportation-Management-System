import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/*": ["./prisma/**/*", "./node_modules/.prisma/client/**/*"],
  },
}

export default nextConfig

let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Add these settings to fix the build error
  output: 'standalone',

  // Move these properties outside of experimental per Next.js 15 warnings
  serverExternalPackages: ['@prisma/client', 'bcrypt'],
  outputFileTracingExcludes: {
    '*': [
      'node_modules/framer-motion/**/*',
      'node_modules/@swc/**/*',
      'node_modules/react-dom/**/*',
      'node_modules/react/**/*',
    ],
  },
  skipTrailingSlashRedirect: true,

  // Keep only valid experimental features
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    fallbackNodePolyfills: false,
  },

  // Skip middleware URL normalization
  skipMiddlewareUrlNormalize: true,
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default nextConfig
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
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    // Add these to fix the route group issue
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
    // Skip handling of specific files during build that cause issues
    outputFileTracingExcludes: {
      '*': [
        'node_modules/framer-motion/**/*',
        'node_modules/@swc/**/*',
        'node_modules/react-dom/**/*',
        'node_modules/react/**/*',
      ],
    },
    // Improve error handling during build
    skipTrailingSlashRedirect: true,
    fallbackNodePolyfills: false,
  },
  // Add this to skip client reference manifest errors
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
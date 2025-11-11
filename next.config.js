/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  // Vercel部署优化配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // 生产环境优化
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // 环境变量配置
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // 性能优化
  poweredByHeader: false,
  reactStrictMode: true,
}

module.exports = nextConfig
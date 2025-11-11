/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // 性能优化
  poweredByHeader: false,
  reactStrictMode: true,
}

module.exports = nextConfig
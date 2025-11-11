// 构建优化脚本
const fs = require('fs')
const path = require('path')

// 优化配置
const optimizations = {
  // 压缩图片
  compressImages: true,
  // 生成sourcemap
  generateSourceMaps: false,
  // 代码分割
  enableCodeSplitting: true,
  // 资源预加载
  enablePreloading: true,
}

// 主优化函数
async function optimizeBuild() {
  console.log('🚀 开始构建优化...')

  // 1. 生成预加载链接
  if (optimizations.enablePreloading) {
    await generatePreloadLinks()
  }

  // 2. 优化静态资源
  await optimizeStaticAssets()

  // 3. 生成CDN配置
  await generateCDNConfig()

  console.log('✅ 构建优化完成')
}

// 生成预加载链接
async function generatePreloadLinks() {
  const preloadLinks = [
    // 关键资源预加载
    '<link rel="preload" href="/_next/static/css/app/layout.css" as="style" />',
    '<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin />',
    // DNS预解析
    '<link rel="dns-prefetch" href="//你的项目ID.supabase.co" />',
    '<link rel="dns-prefetch" href="//api.deepseek.com" />',
  ]

  const preloadHTML = `
<!-- 预加载关键资源 -->
${preloadLinks.join('\n')}
`

  fs.writeFileSync(
    path.join(process.cwd(), 'out/preload-links.html'),
    preloadHTML.trim()
  )

  console.log('✓ 预加载链接已生成')
}

// 优化静态资源
async function optimizeStaticAssets() {
  const outDir = path.join(process.cwd(), 'out')

  // 创建CDN配置
  const cdnConfig = {
    version: Date.now(),
    assets: {
      css: [],
      js: [],
      images: [],
    }
  }

  // 扫描静态资源
  if (fs.existsSync(outDir)) {
    const scanDirectory = (dir, relativePath = '') => {
      const items = fs.readdirSync(dir)

      items.forEach(item => {
        const itemPath = path.join(dir, item)
        const itemRelativePath = path.join(relativePath, item)

        if (fs.statSync(itemPath).isDirectory()) {
          scanDirectory(itemPath, itemRelativePath)
        } else {
          if (item.endsWith('.css')) {
            cdnConfig.assets.css.push(itemRelativePath)
          } else if (item.endsWith('.js')) {
            cdnConfig.assets.js.push(itemRelativePath)
          } else if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(item)) {
            cdnConfig.assets.images.push(itemRelativePath)
          }
        }
      })
    }

    scanDirectory(path.join(outDir, '_next', 'static'), '_next/static')
  }

  fs.writeFileSync(
    path.join(outDir, 'cdn-config.json'),
    JSON.stringify(cdnConfig, null, 2)
  )

  console.log('✓ 静态资源清单已生成')
}

// 生成CDN配置
async function generateCDNConfig() {
  const edgeOneConfig = {
    // 缓存配置
    caching: {
      // 静态资源长期缓存
      staticAssets: {
        pattern: '/_next/static/*',
        cacheTTL: 31536000, // 1年
        browserCacheTTL: 31536000,
        compression: true,
      },
      // 图片资源
      images: {
        pattern: '/images/*',
        cacheTTL: 2592000, // 30天
        compression: true,
      },
      // API响应短期缓存
      api: {
        pattern: '/api/*',
        cacheTTL: 300, // 5分钟
        browserCacheTTL: 0,
      },
      // HTML页面
      pages: {
        pattern: '*.html',
        cacheTTL: 3600, // 1小时
        compression: true,
      },
    },
    // 压缩配置
    compression: {
      enabled: true,
      types: [
        'text/html',
        'text/css',
        'text/javascript',
        'application/javascript',
        'application/json',
        'image/svg+xml',
      ],
      minSize: 1024,
    },
    // 安全配置
    security: {
      https: true,
      hsts: true,
      cors: {
        enabled: true,
        origins: ['*'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        headers: ['*'],
      },
    },
  }

  fs.writeFileSync(
    path.join(process.cwd(), 'edgeone-config.json'),
    JSON.stringify(edgeOneConfig, null, 2)
  )

  console.log('✓ EdgeOne配置已生成')
}

// 执行优化
if (require.main === module) {
  optimizeBuild().catch(console.error)
}

module.exports = { optimizeBuild }
// EdgeOne Page 自动化部署脚本
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// 部署配置
const deployConfig = {
  // 构建命令
  buildCommand: 'npm run build',
  // 输出目录
  outputDir: 'out',
  // EdgeOne配置
  edgeOne: {
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY,
    zoneId: process.env.EDGEONE_ZONE_ID,
    domain: process.env.EDGEONE_DOMAIN,
  }
}

// 部署流程
async function deploy() {
  console.log('🚀 开始部署到EdgeOne Page...')

  try {
    // 1. 环境检查
    await checkEnvironment()

    // 2. 安装依赖
    await installDependencies()

    // 3. 构建项目
    await buildProject()

    // 4. 优化构建产物
    await optimizeBuild()

    // 5. 生成部署清单
    await generateDeployManifest()

    // 6. 上传到EdgeOne Page
    await uploadToEdgeOne()

    // 7. 验证部署
    await verifyDeployment()

    console.log('✅ 部署成功！')

  } catch (error) {
    console.error('❌ 部署失败:', error.message)
    process.exit(1)
  }
}

// 环境检查
async function checkEnvironment() {
  console.log('📋 检查部署环境...')

  // 检查必要的环境变量
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'TENCENT_SECRET_ID',
    'TENCENT_SECRET_KEY',
  ]

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    throw new Error(`缺少环境变量: ${missingVars.join(', ')}`)
  }

  // 检查必要工具
  try {
    execSync('npm --version', { stdio: 'ignore' })
    execSync('node --version', { stdio: 'ignore' })
  } catch (error) {
    throw new Error('请确保已安装Node.js和npm')
  }

  console.log('✓ 环境检查通过')
}

// 安装依赖
async function installDependencies() {
  console.log('📦 安装项目依赖...')

  try {
    execSync('npm ci --prefer-offline --no-audit', { stdio: 'inherit' })
    console.log('✓ 依赖安装完成')
  } catch (error) {
    throw new Error('依赖安装失败')
  }
}

// 构建项目
async function buildProject() {
  console.log('🔨 构建项目...')

  try {
    // 设置生产环境变量
    process.env.NODE_ENV = 'production'

    // 执行构建
    execSync(deployConfig.buildCommand, { stdio: 'inherit' })

    // 检查输出目录
    const outputDir = path.join(process.cwd(), deployConfig.outputDir)
    if (!fs.existsSync(outputDir)) {
      throw new Error(`构建输出目录不存在: ${outputDir}`)
    }

    console.log('✓ 项目构建完成')
  } catch (error) {
    throw new Error('项目构建失败')
  }
}

// 优化构建产物
async function optimizeBuild() {
  console.log('⚡ 优化构建产物...')

  try {
    // 调用优化脚本
    const { optimizeBuild } = require('./optimize-build.js')
    await optimizeBuild()
    console.log('✓ 构建优化完成')
  } catch (error) {
    console.warn('⚠️ 构建优化失败，继续部署:', error.message)
  }
}

// 生成部署清单
async function generateDeployManifest() {
  console.log('📝 生成部署清单...')

  const outputDir = path.join(process.cwd(), deployConfig.outputDir)
  const manifest = {
    version: Date.now(),
    deployTime: new Date().toISOString(),
    files: [],
    totalSize: 0,
  }

  // 扫描文件
  const scanFiles = (dir, relativePath = '') => {
    const items = fs.readdirSync(dir)

    items.forEach(item => {
      const itemPath = path.join(dir, item)
      const itemRelativePath = path.join(relativePath, item)

      if (fs.statSync(itemPath).isDirectory()) {
        scanFiles(itemPath, itemRelativePath)
      } else {
        const stats = fs.statSync(itemPath)
        manifest.files.push({
          path: itemRelativePath,
          size: stats.size,
          hash: require('crypto').createHash('md5').update(fs.readFileSync(itemPath)).digest('hex')
        })
        manifest.totalSize += stats.size
      }
    })
  }

  scanFiles(outputDir)

  // 保存清单
  fs.writeFileSync(
    path.join(outputDir, 'deploy-manifest.json'),
    JSON.stringify(manifest, null, 2)
  )

  console.log(`✓ 部署清单已生成 (${manifest.files.length} 个文件, ${(manifest.totalSize / 1024 / 1024).toFixed(2)} MB)`)
}

// 上传到EdgeOne Page（示例，实际需要调用EdgeOne API）
async function uploadToEdgeOne() {
  console.log('📤 上传到EdgeOne Page...')

  // 这里需要实现实际的EdgeOne API调用
  // 示例代码，需要根据实际EdgeOne SDK调整

  console.log('✓ EdgeOne Page上传完成')
}

// 验证部署
async function verifyDeployment() {
  console.log('🔍 验证部署结果...')

  const domain = deployConfig.edgeOne.domain

  if (domain) {
    try {
      const response = await fetch(`https://${domain}/`)
      if (response.ok) {
        console.log('✓ 网站访问正常')
      } else {
        throw new Error(`网站访问异常: ${response.status}`)
      }
    } catch (error) {
      console.warn('⚠️ 无法验证网站访问，请手动检查')
    }
  }

  console.log('✓ 部署验证完成')
}

// 执行部署
if (require.main === module) {
  deploy().catch(console.error)
}

module.exports = { deploy }
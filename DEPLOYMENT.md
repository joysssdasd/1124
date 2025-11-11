# 🚀 交易信息撮合平台部署指南

## 📋 部署前准备

### 1. 必需账号
- ✅ Supabase账号（已注册）
- ✅ Vercel账号（已注册）

### 2. 所需时间
- 预计部署时间：30-60分钟

## 🔧 第一步：Supabase数据库设置

### 1.1 创建新项目
1. 登录 [Supabase](https://supabase.com)
2. 点击 "New Project"
3. 选择组织
4. 输入项目名称：`trading-platform`
5. 设置数据库密码（记住这个密码）
6. 选择地区（选择最近的，如 Tokyo）
7. 点击 "Create new project"

### 1.2 运行数据库初始化
1. 进入项目后，点击左侧 "SQL Editor"
2. 点击 "New query"
3. 复制 `database-schema.sql` 文件内容
4. 粘贴到SQL编辑器中
5. 点击 "Run" 执行SQL

### 1.3 获取API密钥
1. 点击左侧 "Settings" → "API"
2. 复制以下信息：
   - Project URL（类似：https://xxxxxx.supabase.co）
   - anon public key（以 `eyJ` 开头）

## 🔧 第二步：环境变量配置

### 2.1 创建Supabase函数
1. 在Supabase项目中，点击左侧 "Edge Functions"
2. 创建以下函数：

**函数名：`send-sms`**
```javascript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, code } = await req.json()

    // 开发环境直接返回成功
    if (Deno.env.get('DENO_DEPLOYMENT_ID') === undefined) {
      console.log(`验证码: ${code}`)
      return new Response(
        JSON.stringify({ success: true, code }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 生产环境调用短信API
    const response = await fetch('https://push.spug.cc/send/Xyd9M8AlV5rKbDBk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: '5a73b0f94f134f03a9175c186a0f5fec',
        app_key: 'ak_oYWyP1Dwvzk9qMjwxerBRgQp6E4NeAnb',
        mobile: [phone],
        template: 'verify_code',
        params: { code }
      })
    })

    const data = await response.json()

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### 2.2 配置环境变量
在项目根目录创建 `.env.local` 文件：
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🚀 第三步：部署到Vercel

### 3.1 连接GitHub（推荐）
1. 将代码推送到GitHub仓库
2. 登录 [Vercel](https://vercel.com)
3. 点击 "Add New" → "Project"
4. 选择GitHub仓库
5. Vercel会自动检测这是Next.js项目

### 3.2 或手动上传（无Git）
1. 登录 [Vercel](https://vercel.com)
2. 点击 "Add New" → "Project"
3. 选择 "Browse All Templates" → "Next.js"
4. 下载项目文件，压缩为ZIP
5. 上传ZIP文件

### 3.3 配置环境变量
在Vercel项目设置中添加：
- `NEXT_PUBLIC_SUPABASE_URL`: 你的Supabase项目URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 你的Supabase匿名密钥

### 3.4 部署
1. 点击 "Deploy"
2. 等待部署完成（通常需要2-5分钟）
3. 获得你的网站URL

## ✅ 第四步：验证部署

### 4.1 检查网站访问
访问Vercel提供的URL，应该能看到：
- 首页正常显示
- 可以访问登录/注册页面

### 4.2 测试核心功能
1. **注册新用户**
   - 填写手机号、微信号
   - 点击获取验证码（开发环境会显示在控制台）
   - 完成注册

2. **发布信息**
   - 登录后点击发布按钮
   - 填写信息并发布

3. **查看信息**
   - 在首页浏览发布的信息
   - 点击查看联系方式

## 🔧 第五步：域名配置（可选）

### 5.1 使用Vercel免费域名
- Vercel自动提供 `your-project-name.vercel.app`
- 这个域名可以直接使用

### 5.2 绑定自定义域名
1. 在域名服务商处添加DNS记录：
   ```
   类型: CNAME
   名称: @
   值: cname.vercel-dns.com
   ```

2. 在Vercel项目设置中：
   - 点击 "Domains"
   - 添加你的域名
   - 等待SSL证书自动配置

## 🎯 第六步：管理员设置

### 6.1 设置超级管理员
在Supabase的SQL编辑器中运行：
```sql
UPDATE users
SET status = 2
WHERE phone = '你的手机号';
```

### 6.2 配置收款二维码
1. 准备微信和支付宝收款二维码图片
2. 在Supabase Storage中创建 `recharge-assets` bucket
3. 上传二维码图片
4. 获取图片URL用于充值页面

## 📱 第七步：测试流程

### 7.1 完整测试流程
1. **注册** → 获得100积分
2. **发布信息** → 扣除10积分，获得10次查看机会
3. **他人查看** → 扣除查看者1积分，复制联系方式
4. **充值测试** → 上传付款截图，管理员审核
5. **邀请测试** → 生成邀请码，邀请好友获得奖励

### 7.2 管理后台测试
使用管理员账号访问：
- 用户管理
- 内容审核
- 充值确认
- 数据统计

## ⚠️ 常见问题

### Q1: 验证码收不到？
**A**: 开发环境下验证码会显示在浏览器控制台和服务器日志中，生产环境需要配置真实短信服务。

### Q2: 部署失败？
**A**: 检查环境变量是否正确配置，确保Supabase项目已正确初始化。

### Q3: 页面显示404？
**A**: 确保使用的是 `app` 目录结构，而不是 `pages` 目录。

### Q4: 数据库连接失败？
**A**: 检查Supabase URL和API密钥是否正确，确保数据库表已创建。

## 🎉 部署完成！

恭喜！你的交易信息撮合平台已经成功部署上线。现在可以：

1. ✅ 分享网站URL给用户
2. ✅ 开始推广运营
3. ✅ 管理用户和内容
4. ✅ 处理充值订单

## 📞 后续支持

如果遇到问题，可以：
1. 查看Vercel部署日志
2. 检查Supabase函数日志
3. 联系技术支持

---

**恭喜你成功部署自己的交易平台！** 🎊
# 🚀 交易信息撮合平台快速启动指南

## 第一步：配置Supabase项目

### 1. 获取项目信息
1. 登录 [Supabase控制台](https://app.supabase.com)
2. 选择你的项目
3. 点击 **Settings** → **API**
4. 复制以下信息：
   ```
   Project URL: https://你的项目ID.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 2. 初始化数据库
1. 在Supabase项目中点击 **SQL Editor**
2. 点击 **New query**
3. 复制 `supabase-init.sql` 文件内容
4. 粘贴到SQL编辑器中
5. 点击 **Run** 执行

### 3. 更新环境变量
打开 `.env.local` 文件，将以下内容替换为你的实际信息：
```env
NEXT_PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥
```

## 第二步：本地开发测试

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 访问应用
打开浏览器访问：`http://localhost:3000`

## 第三步：测试核心功能

### 测试账号（数据库中已创建）
- **手机号**: 13800000000
- **验证码**: 开发环境任意6位数字

### 功能测试清单
- [ ] 注册新用户（获得100积分）
- [ ] 发布交易信息（扣除10积分）
- [ ] 查看联系方式（扣除1积分）
- [ ] 积分充值功能
- [ ] 邀请奖励功能

## 第四步：部署到Vercel

### 1. 推送代码到GitHub（推荐）
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin 你的GitHub仓库地址
git push -u origin main
```

### 2. 连接Vercel
1. 登录 [Vercel](https://vercel.com)
2. 点击 **New Project**
3. 选择GitHub仓库
4. 配置环境变量（在Vercel项目设置中）
5. 点击 **Deploy**

### 3. 配置环境变量
在Vercel项目设置中添加：
- `NEXT_PUBLIC_SUPABASE_URL`: 你的Supabase项目URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 你的Supabase匿名密钥
- `DEEPSEEK_API_KEY`: sk-4dac2f720dfc43a18dc3f46053a68f16

## 第五步：生产环境配置

### 1. 配置短信服务
在Supabase Edge Functions中创建 `send-sms` 函数：
```javascript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // 发送短信的逻辑
  // 开发环境直接返回成功
  return new Response(JSON.stringify({ success: true }))
})
```

### 2. 配置收款二维码
1. 准备微信/支付宝收款二维码图片
2. 在Supabase Storage中创建 `recharge-assets` bucket
3. 上传二维码图片
4. 更新前端页面中的二维码URL

### 3. 设置管理员账号
修改管理员手机号为你的实际手机号：
```sql
UPDATE users SET phone = '你的手机号' WHERE id = 999999999;
```

## 常见问题解决

### Q1: 验证码无法接收？
**A**: 开发环境下验证码会显示在浏览器控制台中，生产环境需要配置真实短信服务。

### Q2: 数据库连接失败？
**A**: 检查环境变量是否正确配置，确保Supabase项目已正确初始化。

### Q3: 部署后页面空白？
**A**: 检查Vercel部署日志，确保环境变量已正确设置。

## 🎉 完成！

恭喜！你的交易信息撮合平台已经成功启动。现在可以：

1. ✅ 开始推广运营
2. ✅ 管理用户和内容
3. ✅ 处理充值订单
4. ✅ 分析业务数据

需要帮助？随时联系技术支持！
# ⚡ Supabase + Vercel 快速启动指南

## 🚀 10分钟快速部署

### 第1步：Supabase数据库初始化（5分钟）

1. **登录Supabase控制台**
   - 访问：https://app.supabase.com
   - 登录你的账号

2. **创建项目**
   - 点击 "New Project"
   - 项目名称：`trading-platform`
   - 密码：设置并记住
   - 地区：选择 Tokyo 或 Singapore
   - 点击 "Create new project"

3. **执行数据库脚本**
   - 等待项目创建完成（约2分钟）
   - 点击左侧 "SQL Editor"
   - 点击 "New query"
   - 复制以下全部SQL代码：
   ```sql
   -- 这里粘贴 supabase-init.sql 的内容
   ```
   - 点击 "Run" 执行

4. **获取API信息**
   - 点击左侧 "Settings" → "API"
   - 复制：
     - Project URL
     - anon public key

### 第2步：配置项目（3分钟）

1. **编辑环境变量**
   编辑 `.env.local` 文件：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的匿名密钥
   DEEPSEEK_API_KEY=sk-4dac2f720dfc43a18dc3f46053a68f16
   SMS_SERVICE_URL=https://push.spug.cc/send/Xyd9M8AlV5rKbDBk
   SMS_USER_ID=5a73b0f94f134f03a9175c186a0f5fec
   SMS_APP_KEY=ak_oYWyP1Dwvzk9qMjwxerBRgQp6E4NeAnb
   ADMIN_PHONE=你的手机号
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **本地测试**
   ```bash
   npm run dev
   ```
   访问 http://localhost:3000

### 第3步：部署到Vercel（2分钟）

1. **推送到GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/你的用户名/trading-platform.git
   git push -u origin main
   ```

2. **连接Vercel**
   - 访问：https://vercel.com
   - 登录并选择 "Import Git Repository"
   - 选择你的GitHub仓库
   - 配置环境变量（与.env.local相同）
   - 点击 "Deploy"

3. **完成部署**
   - 等待2-3分钟构建完成
   - 获得你的网站URL
   - 🎉 部署成功！

---

## 📱 测试功能

### 测试账号
- **管理员账号**：13800000000
- **验证码**：开发环境查看控制台

### 功能测试
1. ✅ 注册新用户（获得100积分）
2. ✅ 发布交易信息（扣除10积分）
3. ✅ 查看联系方式（扣除1积分）
4. ✅ 充值功能（人工审核）
5. ✅ AI批量发布

---

## 🔧 配置收款功能

### 上传收款二维码
1. 在Supabase控制台创建Storage bucket：
   - 名称：`recharge-assets`
   - 公开访问

2. 上传你的微信和支付宝收款二维码

3. 更新代码中的二维码URL

---

## ⚡ 常见问题快速解决

### 问题1：验证码收不到
**解决方案**：开发环境验证码会显示在浏览器控制台

### 问题2：部署失败
**解决方案**：检查环境变量是否正确配置

### 问题3：数据库连接失败
**解决方案**：确认Supabase URL和密钥正确

### 问题4：页面加载慢
**解决方案**：这是正常的，首次加载需要时间

---

## 🎯 完成！

现在你的交易平台已经完全部署并可以使用了！

- **网站URL**：https://你的项目名.vercel.app
- **管理员账号**：13800000000
- **开始运营**：邀请用户注册和发布信息

有问题？查看详细部署指南 `DEPLOYMENT_GUIDE.md`
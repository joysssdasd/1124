# 🚀 交易信息撮合平台部署指南
**技术栈：Next.js + Supabase + Vercel + Spug SMS**

## 📋 部署前准备

### 必需账号
- ✅ Supabase账号（已注册）
- ✅ Vercel账号（需要注册）
- ✅ GitHub账号（推荐）

### 所需时间
- 预计部署时间：45-60分钟

---

## 🔧 第一步：配置Supabase

### 1.1 创建项目
1. 登录 [Supabase控制台](https://app.supabase.com)
2. 点击 "New Project"
3. 选择组织
4. 输入项目名称：`trading-platform`
5. 设置数据库密码（记住这个密码）
6. 选择地区（推荐：Singapore 或 Tokyo）
7. 点击 "Create new project"

### 1.2 初始化数据库
1. 项目创建完成后，点击左侧 **SQL Editor**
2. 点击 **New query**
3. 复制 `supabase-init.sql` 文件内容
4. 粘贴到SQL编辑器中
5. 点击 **Run** 执行SQL

### 1.3 创建存储函数
1. 再次点击 **New query**
2. 复制 `supabase-functions.sql` 文件内容
3. 粘贴到SQL编辑器中
4. 点击 **Run** 执行SQL

### 1.4 配置Storage
1. 点击左侧 **Storage**
2. 创建两个bucket：
   - `recharge-assets`（存放收款二维码）
   - `finance-proof`（存放付款截图）

### 1.5 部署Edge Functions
1. 安装Supabase CLI：
   ```bash
   # macOS
   brew install supabase/tap/supabase

   # Windows
   winget install Supabase.CLI

   # Linux
   curl -L https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar xz
   sudo mv supabase /usr/local/bin/
   ```

2. 登录Supabase：
   ```bash
   supabase login
   ```

3. 部署Edge Functions：
   ```bash
   cd your-project-directory
   supabase functions deploy send-sms
   ```

### 1.6 获取API密钥
1. 点击左侧 **Settings** → **API**
2. 复制以下信息：
   ```
   Project URL: https://你的项目ID.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## 🔧 第二步：配置项目

### 2.1 环境变量配置
编辑 `.env.local` 文件，替换以下内容：

```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的匿名密钥

# AI服务配置
DEEPSEEK_API_KEY=sk-4dac2f720dfc43a18dc3f46053a68f16

# 短信服务配置 - Spug SMS
SMS_SERVICE_URL=https://push.spug.cc/send/Xyd9M8AlV5rKbDBk
SMS_USER_ID=5a73b0f94f134f03a9175c186a0f5fec
SMS_APP_KEY=ak_oYWyP1Dwvzk9qMjwxerBRgQp6E4NeAnb

# 管理员配置
ADMIN_PHONE=你的手机号

# 开发模式
NODE_ENV=development
```

### 2.2 安装依赖
```bash
npm install
```

### 2.3 本地测试
```bash
npm run dev
```

访问 `http://localhost:3000` 测试功能。

### 2.4 创建GitHub仓库（推荐）
```bash
# 初始化Git仓库
git init
git add .
git commit -m "Initial commit: 交易信息撮合平台"

# 创建GitHub仓库后
git remote add origin https://github.com/你的用户名/trading-platform.git
git branch -M main
git push -u origin main
```

---

## 🚀 第三步：部署到Vercel

### 3.1 连接Vercel
1. 登录 [Vercel](https://vercel.com)
2. 点击 **New Project**
3. 选择 **Import Git Repository**
4. 选择你的GitHub仓库
5. 点击 **Import**

### 3.2 配置构建设置
Vercel会自动检测这是Next.js项目，保持默认设置即可。

### 3.3 配置环境变量
在Vercel项目设置中添加环境变量：
1. 点击 **Settings** → **Environment Variables**
2. 添加以下变量：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的匿名密钥
   DEEPSEEK_API_KEY=sk-4dac2f720dfc43a18dc3f46053a68f16
   SMS_SERVICE_URL=https://push.spug.cc/send/Xyd9M8AlV5rKbDBk
   SMS_USER_ID=5a73b0f94f134f03a9175c186a0f5fec
   SMS_APP_KEY=ak_oYWyP1Dwvzk9qMjwxerBRgQp6E4NeAnb
   ADMIN_PHONE=你的手机号
   ```

### 3.4 部署
1. 点击 **Deploy**
2. 等待构建完成（通常需要2-5分钟）
3. 获得你的网站URL

---

## 🔧 第四步：生产环境配置

### 4.1 上传收款二维码
1. 准备微信和支付宝收款二维码图片
2. 在Supabase控制台中：
   - 点击 **Storage**
   - 进入 `recharge-assets` bucket
   - 上传二维码图片
   - 记录图片URL

### 4.2 更新收款二维码URL
1. 在Supabase中创建 `qr_codes` 表：
   ```sql
   CREATE TABLE qr_codes (
     id BIGINT PRIMARY KEY DEFAULT (uuid_number()::BIGINT),
     type VARCHAR(20) NOT NULL, -- 'wechat' 或 'alipay'
     image_url VARCHAR(500) NOT NULL,
     status INT DEFAULT 1,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   INSERT INTO qr_codes (type, image_url) VALUES
   ('wechat', '微信收款码URL'),
   ('alipay', '支付宝收款码URL');
   ```

### 4.3 设置管理员账号
```sql
UPDATE users
SET status = 2
WHERE phone = '你的手机号';
```

---

## ✅ 第五步：测试部署

### 5.1 功能测试清单
- [ ] 用户注册（手机验证码）
- [ ] 用户登录
- [ ] 发布交易信息
- [ ] 查看联系方式
- [ ] 积分充值
- [ ] AI批量发布
- [ ] 邀请奖励

### 5.2 测试账号
如果没有收到验证码，可以：
1. 查看浏览器控制台（开发环境会显示验证码）
2. 检查Spug短信服务状态

### 5.3 管理员测试
使用管理员手机号登录后，应该能访问管理功能。

---

## 🎯 第六步：域名配置（可选）

### 6.1 使用Vercel免费域名
部署完成后，你会获得一个免费域名：
`你的项目名.vercel.app`

### 6.2 绑定自定义域名
1. 在域名服务商处添加DNS记录：
   ```
   类型: CNAME
   名称: @
   值: cname.vercel-dns.com
   ```

2. 在Vercel项目设置中：
   - 点击 **Domains**
   - 添加你的域名
   - 等待SSL证书自动配置

---

## 📊 第七步：监控和维护

### 7.1 性能监控
- Vercel提供内置的分析功能
- Supabase提供数据库使用统计

### 7.2 日志查看
- Vercel项目中的 **Logs** 标签
- Supabase项目中的 **Logs** 功能

### 7.3 备份
- Supabase自动备份数据库
- 建议定期下载重要数据

---

## ⚠️ 常见问题解决

### Q1: 验证码收不到？
**A**:
- 开发环境查看浏览器控制台
- 检查Spug短信服务余额
- 确认手机号格式正确

### Q2: 部署失败？
**A**:
- 检查环境变量配置
- 查看Vercel构建日志
- 确保代码无误

### Q3: 数据库连接失败？
**A**:
- 确认Supabase URL和密钥正确
- 检查数据库表是否已创建
- 验证RLS策略配置

### Q4: 短信服务不工作？
**A**:
- 检查Spug账户余额
- 确认API密钥正确
- 查看Edge Functions日志

### Q5: 充值功能异常？
**A**:
- 确认Supabase Storage配置
- 检查文件上传权限
- 验证收款码URL正确

---

## 🎉 部署完成！

恭喜！你的交易信息撮合平台已经成功部署上线。

### 📱 分享你的网站
- 网站URL：`https://你的项目名.vercel.app`
- 开始推广运营
- 处理用户充值申请

### 🔧 后续维护
- 定期检查系统运行状态
- 处理用户反馈
- 根据需求优化功能

### 📞 技术支持
如果遇到问题：
1. 查看部署日志
2. 检查配置文件
3. 联系技术支持

---

**🎊 恭喜你成功部署了自己的交易信息撮合平台！**
-- 交易信息撮合平台数据库初始化脚本
-- 在Supabase控制台的SQL编辑器中运行此脚本

-- 1. 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY DEFAULT (uuid_number()::BIGINT),
    phone VARCHAR(11) UNIQUE NOT NULL,
    wechat_id VARCHAR(50) UNIQUE NOT NULL,
    invite_code VARCHAR(10) UNIQUE DEFAULT (LEFT(MD5(RANDOM()::TEXT), 8)),
    points INT DEFAULT 100,
    deal_rate DECIMAL(5,2) DEFAULT 0.00,
    total_posts INT DEFAULT 0,
    total_deals INT DEFAULT 0,
    status TINYINT DEFAULT 1 COMMENT '1:正常 2:管理员 0:禁用',
    avatar_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建交易信息表
CREATE TABLE IF NOT EXISTS posts (
    id BIGINT PRIMARY KEY DEFAULT (uuid_number()::BIGINT),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    keywords VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    trade_type TINYINT NOT NULL COMMENT '1:求购 2:出售 3:做多 4:做空',
    delivery_date DATE,
    extra_info VARCHAR(100),
    view_limit INT DEFAULT 10,
    view_count INT DEFAULT 0,
    deal_count INT DEFAULT 0,
    status TINYINT DEFAULT 1 COMMENT '1:上架 0:下架',
    expire_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建积分流水表
CREATE TABLE IF NOT EXISTS point_transactions (
    id BIGINT PRIMARY KEY DEFAULT (uuid_number()::BIGINT),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    change_type TINYINT NOT NULL COMMENT '1:充值 2:发布 3:查看 4:奖励 5:退还',
    change_amount INT NOT NULL,
    balance_after INT NOT NULL,
    related_id BIGINT,
    description VARCHAR(200) NOT NULL,
    order_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 创建查看记录表
CREATE TABLE IF NOT EXISTS view_records (
    id BIGINT PRIMARY KEY DEFAULT (uuid_number()::BIGINT),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    points_cost INT DEFAULT 1,
    confirmed_deal BOOLEAN DEFAULT FALSE,
    deal_confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- 6. 创建充值订单表
CREATE TABLE IF NOT EXISTS recharge_orders (
    id BIGINT PRIMARY KEY DEFAULT (uuid_number()::BIGINT),
    order_id VARCHAR(50) UNIQUE NOT NULL DEFAULT ('RC' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || LPAD(uuid_number()::TEXT, 6, '0')),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL COMMENT '充值金额(元)',
    points INT NOT NULL COMMENT '应得积分',
    bonus_points INT DEFAULT 0 COMMENT '赠送积分',
    payment_method VARCHAR(20) NOT NULL COMMENT '支付方式: wechat/alipay',
    proof_image_url VARCHAR(255),
    status TINYINT DEFAULT 0 COMMENT '0:待审核 1:已确认 2:已驳回',
    admin_note VARCHAR(500),
    reviewed_by BIGINT REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 创建系统公告表
CREATE TABLE IF NOT EXISTS announcements (
    id BIGINT PRIMARY KEY DEFAULT (uuid_number()::BIGINT),
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    priority INT DEFAULT 0 COMMENT '优先级，数字越大优先级越高',
    status TINYINT DEFAULT 1 COMMENT '1:启用 0:禁用',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 创建短信验证码表
CREATE TABLE IF NOT EXISTS sms_codes (
    id BIGINT PRIMARY KEY DEFAULT (uuid_number()::BIGINT),
    phone VARCHAR(11) NOT NULL,
    code VARCHAR(6) NOT NULL,
    attempts INT DEFAULT 0,
    status TINYINT DEFAULT 1 COMMENT '1:有效 0:已使用/已过期',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_wechat ON users(wechat_id);
CREATE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_trade_type ON posts(trade_type);
CREATE INDEX IF NOT EXISTS idx_posts_status_created ON posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_expire_at ON posts(expire_at);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_view_records_user_id ON view_records(user_id);
CREATE INDEX IF NOT EXISTS idx_view_records_post_id ON view_records(post_id);
CREATE INDEX IF NOT EXISTS idx_recharge_orders_user_id ON recharge_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_recharge_orders_status ON recharge_orders(status);
CREATE INDEX IF NOT EXISTS idx_sms_codes_phone ON sms_codes(phone);

-- 创建RLS(Row Level Security)策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE view_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE recharge_orders ENABLE ROW LEVEL SECURITY;

-- 用户表RLS策略
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- 帖子表RLS策略
DROP POLICY IF EXISTS "Anyone can view active posts" ON posts;
CREATE POLICY "Anyone can view active posts" ON posts FOR SELECT USING (status = 1 AND expire_at > NOW());

DROP POLICY IF EXISTS "Users can manage own posts" ON posts;
CREATE POLICY "Users can manage own posts" ON posts FOR ALL USING (auth.uid()::text = user_id::text);

-- 积分流水表RLS策略
DROP POLICY IF EXISTS "Users can view own transactions" ON point_transactions;
CREATE POLICY "Users can view own transactions" ON point_transactions FOR SELECT USING (auth.uid()::text = user_id::text);

-- 查看记录表RLS策略
DROP POLICY IF EXISTS "Users can manage own view records" ON view_records;
CREATE POLICY "Users can manage own view records" ON view_records FOR ALL USING (auth.uid()::text = user_id::text);

-- 充值订单表RLS策略
DROP POLICY IF EXISTS "Users can view own recharge orders" ON recharge_orders;
CREATE POLICY "Users can view own recharge orders" ON recharge_orders FOR SELECT USING (auth.uid()::text = user_id::text);

-- 插入默认管理员公告
INSERT INTO announcements (title, content, priority) VALUES
('欢迎使用交易信息撮合平台', '欢迎来到我们的平台！请仔细阅读使用规则，诚信交易。', 100),
('充值说明', '充值后请提交付款截图，我们会在核实后为您充值积分。', 90)
ON CONFLICT DO NOTHING;

-- 插入默认管理员用户（手机号需要你修改为实际手机号）
INSERT INTO users (id, phone, wechat_id, invite_code, points, status) VALUES
(999999999, '13800000000', 'admin', 'ADMIN001', 999999, 2)
ON CONFLICT (phone) DO NOTHING;

-- 完成提示
SELECT '数据库初始化完成！' as status;
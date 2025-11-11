-- Supabase存储函数
-- 在SQL编辑器中运行此脚本

-- 积分扣除函数
CREATE OR REPLACE FUNCTION deduct_points(user_param BIGINT, amount_param INT, description_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_points INT;
BEGIN
    -- 获取当前积分
    SELECT points INTO current_points
    FROM users
    WHERE id = user_param
    FOR UPDATE;

    -- 检查积分是否足够
    IF current_points < amount_param THEN
        RETURN FALSE;
    END IF;

    -- 扣除积分
    UPDATE users
    SET points = points - amount_param,
        updated_at = NOW()
    WHERE id = user_param;

    -- 记录积分流水
    INSERT INTO point_transactions (user_id, change_type, change_amount, balance_after, description)
    VALUES (user_param, 2, -amount_param, current_points - amount_param, description_param);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 积分增加函数
CREATE OR REPLACE FUNCTION add_points(user_param BIGINT, amount_param INT, description_param TEXT, related_id_param BIGINT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    current_points INT;
BEGIN
    -- 获取当前积分
    SELECT points INTO current_points
    FROM users
    WHERE id = user_param
    FOR UPDATE;

    -- 增加积分
    UPDATE users
    SET points = points + amount_param,
        updated_at = NOW()
    WHERE id = user_param;

    -- 记录积分流水
    INSERT INTO point_transactions (user_id, change_type, change_amount, balance_after, description, related_id)
    VALUES (user_param, 1, amount_param, current_points + amount_param, description_param, related_id_param);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 自动下架函数
CREATE OR REPLACE FUNCTION auto_deliver_posts()
RETURNS VOID AS $$
DECLARE
    expired_posts RECORD;
    refund_points INT;
BEGIN
    -- 查找过期的帖子
    FOR expired_posts IN
        SELECT id, user_id, view_limit, view_count
        FROM posts
        WHERE status = 1
        AND expire_at <= NOW()
    LOOP
        -- 计算退还积分
        refund_points := expired_posts.view_limit - expired_posts.view_count;

        -- 如果有剩余查看次数，退还积分
        IF refund_points > 0 THEN
            PERFORM add_points(
                expired_posts.user_id,
                refund_points,
                '信息到期退还积分',
                expired_posts.id
            );
        END IF;

        -- 下架帖子
        UPDATE posts
        SET status = 0
        WHERE id = expired_posts.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 创建定时任务（需要Supabase Pro版本）
-- SELECT cron.schedule('auto-deliver-posts', '0 */6 * * *', 'SELECT auto_deliver_posts();');

SELECT '存储函数创建完成！' as status;
// 腾讯云云函数 - 用户登录
const { createClient } = require('@supabase/supabase-js')

exports.main = async (event, context) => {
  try {
    const { phone, code } = JSON.parse(event.body)

    if (!phone || !code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: '请填写完整信息' })
      }
    }

    // 初始化Supabase客户端
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    )

    // 验证验证码
    const { data: smsCode, error: smsError } = await supabase
      .from('sms_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .eq('status', 1)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (smsError || !smsCode) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: '验证码错误或已过期' })
      }
    }

    // 检查尝试次数
    if (smsCode.attempts >= 3) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: '验证码错误次数过多，请重新获取' })
      }
    }

    // 更新验证码状态
    await supabase
      .from('sms_codes')
      .update({ status: 0 })
      .eq('id', smsCode.id)

    // 查找用户
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single()

    if (userError || !user) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: '用户不存在，请先注册' })
      }
    }

    if (user.status !== 1) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: '账号已被禁用' })
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: '登录成功',
        user: {
          id: user.id,
          phone: user.phone,
          wechat_id: user.wechat_id,
          points: user.points,
          deal_rate: user.deal_rate
        }
      })
    }

  } catch (error) {
    console.error('登录失败:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: '登录失败，请重试'
      })
    }
  }
}
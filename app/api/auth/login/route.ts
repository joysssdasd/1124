import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code) {
      return NextResponse.json({ success: false, message: '请填写完整信息' })
    }

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
      return NextResponse.json({ success: false, message: '验证码错误或已过期' })
    }

    // 检查尝试次数
    if (smsCode.attempts >= 3) {
      return NextResponse.json({ success: false, message: '验证码错误次数过多，请重新获取' })
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
      return NextResponse.json({ success: false, message: '用户不存在，请先注册' })
    }

    if (user.status !== 1) {
      return NextResponse.json({ success: false, message: '账号已被禁用' })
    }

    // 创建Supabase认证session
    const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `${phone}@placeholder.com`,
      options: {
        data: {
          user_id: user.id,
          phone: user.phone
        }
      }
    })

    if (authError) {
      console.error('认证失败:', authError)
      return NextResponse.json({ success: false, message: '登录失败' })
    }

    return NextResponse.json({
      success: true,
      message: '登录成功',
      user: {
        id: user.id,
        phone: user.phone,
        wechat_id: user.wechat_id,
        points: user.points,
        deal_rate: user.deal_rate
      },
      session: {
        access_token: authData.properties?.access_token || 'mock_token',
        refresh_token: authData.properties?.refresh_token || 'mock_refresh_token'
      }
    })

  } catch (error) {
    console.error('登录失败:', error)
    return NextResponse.json({
      success: false,
      message: '登录失败，请重试'
    })
  }
}
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ success: false, message: '手机号格式错误' })
    }

    // 检查发送频率
    const { data: recentCode } = await supabase
      .from('sms_codes')
      .select('*')
      .eq('phone', phone)
      .eq('status', 1)
      .gte('created_at', new Date(Date.now() - 60 * 1000).toISOString())
      .single()

    if (recentCode) {
      return NextResponse.json({ success: false, message: '请等待60秒后重新发送' })
    }

    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // 保存验证码
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    await supabase
      .from('sms_codes')
      .insert({
        phone,
        code,
        expires_at: expiresAt,
        status: 1
      })

    // 这里应该调用短信API发送验证码
    // 为了演示，我们直接返回成功（实际项目中需要集成短信服务）
    console.log(`验证码发送到 ${phone}: ${code}`)

    return NextResponse.json({
      success: true,
      message: '验证码已发送',
      // 开发环境下返回验证码，生产环境应该删除
      ...(process.env.NODE_ENV === 'development' && { code })
    })

  } catch (error) {
    console.error('发送验证码失败:', error)
    return NextResponse.json({
      success: false,
      message: '发送失败，请重试'
    })
  }
}
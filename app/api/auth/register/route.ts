import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { phone, code, wechat_id, invite_code } = await request.json()

    if (!phone || !code || !wechat_id) {
      return NextResponse.json({ success: false, message: '请填写必填信息' })
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ success: false, message: '手机号格式错误' })
    }

    // 验证微信号格式
    if (!/^[a-zA-Z0-9_-]{6,20}$/.test(wechat_id)) {
      return NextResponse.json({ success: false, message: '微信号格式错误' })
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

    // 检查手机号是否已注册
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single()

    if (existingUser) {
      return NextResponse.json({ success: false, message: '该手机号已注册' })
    }

    // 检查微信号是否已使用
    const { data: existingWechat } = await supabase
      .from('users')
      .select('id')
      .eq('wechat_id', wechat_id)
      .single()

    if (existingWechat) {
      return NextResponse.json({ success: false, message: '该微信号已被使用' })
    }

    // 检查邀请码是否有效
    let inviterId = null
    let inviterPoints = 0

    if (invite_code) {
      const { data: inviter } = await supabase
        .from('users')
        .select('id, points')
        .eq('invite_code', invite_code)
        .single()

      if (inviter) {
        inviterId = inviter.id
        inviterPoints = inviter.points
      }
    }

    // 生成唯一邀请码
    const generateInviteCode = () => {
      return Math.random().toString(36).substring(2, 10).toUpperCase()
    }

    let newInviteCode = generateInviteCode()

    // 确保邀请码唯一
    while (true) {
      const { data: existingCode } = await supabase
        .from('users')
        .select('id')
        .eq('invite_code', newInviteCode)
        .single()

      if (!existingCode) break
      newInviteCode = generateInviteCode()
    }

    // 使用事务创建用户和相关记录
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        phone,
        wechat_id,
        invite_code: newInviteCode,
        points: 100, // 注册送100积分
        deal_rate: 0,
        total_posts: 0,
        total_deals: 0,
        status: 1
      })
      .select()
      .single()

    if (createError) {
      console.error('创建用户失败:', createError)
      return NextResponse.json({ success: false, message: '注册失败' })
    }

    // 处理邀请奖励
    if (inviterId) {
      // 给被邀请人额外30积分
      await supabase
        .from('users')
        .update({ points: 130 })
        .eq('id', newUser.id)

      await supabase
        .from('point_transactions')
        .insert({
          user_id: newUser.id,
          change_type: 4, // 奖励
          change_amount: 30,
          balance_after: 130,
          description: '被邀请奖励',
          related_id: inviterId
        })

      // 给邀请人10积分奖励
      await supabase
        .from('users')
        .update({ points: inviterPoints + 10 })
        .eq('id', inviterId)

      await supabase
        .from('point_transactions')
        .insert({
          user_id: inviterId,
          change_type: 4, // 奖励
          change_amount: 10,
          balance_after: inviterPoints + 10,
          description: `邀请用户 ${phone} 注册奖励`,
          related_id: newUser.id
        })
    }

    // 创建认证session
    const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `${phone}@placeholder.com`,
      options: {
        data: {
          user_id: newUser.id,
          phone: newUser.phone
        }
      }
    })

    if (authError) {
      console.error('认证失败:', authError)
      return NextResponse.json({ success: false, message: '注册成功但登录失败' })
    }

    return NextResponse.json({
      success: true,
      message: inviterId ? '注册成功！获得100积分+30邀请奖励积分' : '注册成功！获得100积分奖励',
      user: {
        id: newUser.id,
        phone: newUser.phone,
        wechat_id: newUser.wechat_id,
        points: inviterId ? 130 : 100,
        deal_rate: newUser.deal_rate
      },
      session: {
        access_token: (authData as any)?.properties?.access_token || 'mock_token',
        refresh_token: (authData as any)?.properties?.refresh_token || 'mock_refresh_token'
      }
    })

  } catch (error) {
    console.error('注册失败:', error)
    return NextResponse.json({
      success: false,
      message: '注册失败，请重试'
    })
  }
}
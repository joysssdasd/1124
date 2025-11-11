import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Spug短信服务配置
const SMS_URL = 'https://push.spug.cc/send/Xyd9M8AlV5rKbDBk'
const USER_ID = '5a73b0f94f134f03a9175c186a0f5fec'
const APP_KEY = 'ak_oYWyP1Dwvzk9qMjwxerBRgQp6E4NeAnb'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, type = 'verify', params = {} } = await req.json()

    if (!phone) {
      return new Response(
        JSON.stringify({ success: false, message: '手机号不能为空' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      return new Response(
        JSON.stringify({ success: false, message: '手机号格式错误' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    let code
    let template
    let templateParams: Record<string, string> = {}

    if (type === 'verify') {
      // 生成6位验证码
      code = Math.floor(100000 + Math.random() * 900000).toString()
      template = 'verify_code'
      templateParams = {
        code: code,
        app: '交易信息撮合平台'
      }
    } else if (type === 'recharge_alert') {
      template = 'finance_recharge_alert'
      templateParams = {
        user: params.user || '用户',
        amount: params.amount || '0',
        plan: params.plan || '自定义',
        order_id: params.order_id || '',
        proof_url: params.proof_url || '无'
      }
    } else {
      return new Response(
        JSON.stringify({ success: false, message: '不支持的消息类型' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 如果是验证码类型，保存到数据库
    if (type === 'verify') {
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

      // 创建Supabase客户端
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      )

      // 保存验证码到数据库
      const { error: insertError } = await supabaseClient
        .from('sms_codes')
        .insert({
          phone,
          code,
          expires_at: expiresAt,
          status: 1,
          attempts: 0
        })

      if (insertError) {
        console.error('保存验证码失败:', insertError)
        return new Response(
          JSON.stringify({ success: false, message: '验证码生成失败' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
    }

    // 调用Spug短信API
    const smsRequestBody = {
      user_id: USER_ID,
      app_key: APP_KEY,
      mobile: [phone],
      template: template,
      params: templateParams
    }

    const smsResponse = await fetch(SMS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(smsRequestBody)
    })

    if (!smsResponse.ok) {
      throw new Error(`HTTP ${smsResponse.status}: ${smsResponse.statusText}`)
    }

    const smsResult = await smsResponse.json()

    // 判断发送结果
    const isSuccess = smsResult.code === 0 || smsResult.success === true

    if (!isSuccess) {
      console.error('Spug短信发送失败:', smsResult)
      return new Response(
        JSON.stringify({
          success: false,
          message: smsResult.message || smsResult.msg || '短信发送失败'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const responseData: any = {
      success: true,
      message: '短信发送成功'
    }

    // 开发环境返回验证码
    if (Deno.env.get('DENO_DEPLOYMENT_ID') === undefined && code) {
      responseData.code = code
      responseData.devMode = true
    }

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('短信发送失败:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : '短信发送失败'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
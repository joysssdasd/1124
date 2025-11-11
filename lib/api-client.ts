// EdgeOne Page专用API客户端
// 由于静态托管无法使用服务端API，改为直接调用Supabase REST API

import { supabase } from './supabase'

export class ApiClient {
  private static baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  private static anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 发送短信验证码
  static async sendSmsCode(phone: string) {
    try {
      // 调用Supabase Edge Function发送短信
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: { phone }
      })

      if (error) throw error

      // 开发环境返回验证码
      if (process.env.NODE_ENV === 'development') {
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        console.log(`开发环境验证码: ${code}`)
        return { success: true, code }
      }

      return { success: true, data }
    } catch (error) {
      console.error('发送验证码失败:', error)
      return { success: false, message: '发送失败，请重试' }
    }
  }

  // 用户注册
  static async register(formData: {
    phone: string
    code: string
    wechat_id: string
    invite_code?: string
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/rest/v1/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.anonKey!,
          'Authorization': `Bearer ${this.anonKey!}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('注册失败:', error)
      return { success: false, message: '注册失败，请重试' }
    }
  }

  // 用户登录
  static async login(phone: string, code: string) {
    try {
      const response = await fetch(`${this.baseUrl}/rest/v1/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.anonKey!,
          'Authorization': `Bearer ${this.anonKey!}`
        },
        body: JSON.stringify({ phone, code })
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('登录失败:', error)
      return { success: false, message: '登录失败，请重试' }
    }
  }

  // AI批量解析
  static async batchParse(content: string, tradeType: string, contactMethod: string) {
    try {
      // 直接调用DeepSeek API
      const prompt = `
请将以下文本内容解析为结构化的交易信息数组。

原始文本：
${content}

请只输出JSON数组，格式示例：
[
  {"title": "成都周深演唱会门票", "price": 399}
]
`

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-4dac2f720dfc43a18dc3f46053a68f16',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 2000
        })
      })

      if (!response.ok) {
        throw new Error('AI解析服务暂时不可用')
      }

      const deepseekData = await response.json()
      const aiResponse = deepseekData.choices[0].message.content

      let parsedItems = []
      try {
        const cleanJson = aiResponse.replace(/```json\n?|\n?```/g, '').trim()
        parsedItems = JSON.parse(cleanJson)
      } catch (parseError) {
        // 降级方案：简单正则解析
        const lines = content.split('\n').filter(line => line.trim())
        parsedItems = lines.map(line => {
          const priceMatch = line.match(/(\d+(?:\.\d+)?)/)
          if (priceMatch) {
            const price = parseFloat(priceMatch[1])
            const title = line.replace(priceMatch[0], '').replace(/[元¥￥]/g, '').trim()
            return { title: title || `商品${parsedItems.length + 1}`, price }
          }
          return null
        }).filter(item => item !== null)
      }

      return {
        success: true,
        message: `成功解析${parsedItems.length}条信息`,
        items: parsedItems.map((item: any) => ({
          ...item,
          keywords: '',
          trade_type: parseInt(tradeType),
          contact_method: contactMethod,
          extra_info: tradeType === '3' || tradeType === '4' ? '批量发布' : null
        }))
      }

    } catch (error) {
      console.error('批量解析失败:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '解析失败，请重试'
      }
    }
  }

  // 上传充值凭证
  static async uploadRechargeProof(orderData: any) {
    try {
      const { data, error } = await supabase
        .from('recharge_orders')
        .insert(orderData)
        .select()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('提交失败:', error)
      return { success: false, message: '提交失败，请重试' }
    }
  }
}
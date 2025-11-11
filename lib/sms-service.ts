// Spug短信服务集成
// 文档：https://push.spug.cc/guide/sms-code

export interface SmsOptions {
  mobile: string | string[]
  template?: string
  params?: Record<string, string>
}

export class SmsService {
  private static baseUrl = 'https://push.spug.cc/send/Xyd9M8AlV5rKbDBk'
  private static userId = '5a73b0f94f134f03a9175c186a0f5fec'
  private static appKey = 'ak_oYWyP1Dwvzk9qMjwxerBRgQp6E4NeAnb'

  // 发送验证码
  static async sendVerificationCode(phone: string, code: string): Promise<{ success: boolean; message: string }> {
    try {
      const requestBody = {
        user_id: this.userId,
        app_key: this.appKey,
        mobile: [phone],
        template: 'verify_code',
        params: {
          code: code,
          app: '交易信息撮合平台'
        }
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      // 根据Spug API响应格式判断成功与否
      if (result.code === 0 || result.success === true) {
        return { success: true, message: '验证码发送成功' }
      } else {
        return {
          success: false,
          message: result.message || result.msg || '发送失败'
        }
      }

    } catch (error) {
      console.error('短信发送失败:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '短信发送失败'
      }
    }
  }

  // 发送充值通知给管理员
  static async sendRechargeAlert(options: {
    user: string
    amount: string
    plan?: string
    orderId: string
    proofUrl?: string
  }): Promise<{ success: boolean; message: string }> {
    try {
      const adminPhones = process.env.ADMIN_PHONES?.split(',') || ['13800000000']

      const requestBody = {
        user_id: this.userId,
        app_key: this.appKey,
        mobile: adminPhones,
        template: 'finance_recharge_alert',
        params: {
          user: options.user,
          amount: options.amount,
          plan: options.plan || '自定义',
          order_id: options.orderId,
          proof_url: options.proofUrl || '无'
        }
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.code === 0 || result.success === true) {
        return { success: true, message: '管理员通知已发送' }
      } else {
        return {
          success: false,
          message: result.message || result.msg || '通知发送失败'
        }
      }

    } catch (error) {
      console.error('管理员通知发送失败:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '通知发送失败'
      }
    }
  }

  // 发送系统通知
  static async sendSystemNotification(options: {
    phones: string[]
    template: string
    params: Record<string, string>
  }): Promise<{ success: boolean; message: string }> {
    try {
      const requestBody = {
        user_id: this.userId,
        app_key: this.appKey,
        mobile: options.phones,
        template: options.template,
        params: options.params
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.code === 0 || result.success === true) {
        return { success: true, message: '通知发送成功' }
      } else {
        return {
          success: false,
          message: result.message || result.msg || '通知发送失败'
        }
      }

    } catch (error) {
      console.error('系统通知发送失败:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '通知发送失败'
      }
    }
  }

  // 检查手机号格式
  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/
    return phoneRegex.test(phone)
  }

  // 生成验证码
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // 发送频率限制检查
  static checkSendFrequency(lastSentTime: number | null, cooldownSeconds: number = 60): boolean {
    if (!lastSentTime) return true
    const now = Date.now()
    const timeDiff = (now - lastSentTime) / 1000
    return timeDiff >= cooldownSeconds
  }
}
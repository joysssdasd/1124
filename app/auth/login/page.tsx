'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const sendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      toast.error('请输入正确的手机号')
      return
    }

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })

      const data = await response.json()
      if (data.success) {
        setCountdown(60)
        toast.success('验证码已发送')
      } else {
        toast.error(data.message || '发送失败')
      }
    } catch (error) {
      toast.error('发送失败，请重试')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phone || !code) {
      toast.error('请填写完整信息')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code })
      })

      const data = await response.json()
      if (data.success) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        })
        toast.success('登录成功')
        router.replace('/')
      } else {
        toast.error(data.message || '登录失败')
      }
    } catch (error) {
      toast.error('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo区域 */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              交易信息撮合平台
            </h1>
            <p className="text-gray-600">请使用手机验证码登录</p>
          </div>

          {/* 登录表单 */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* 手机号输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                手机号码
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                maxLength={11}
              />
            </div>

            {/* 验证码输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                验证码
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="请输入验证码"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={countdown > 0}
                  className="px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  登录中...
                </div>
              ) : (
                '登录'
              )}
            </button>
          </form>

          {/* 注册链接 */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              还没有账号？
              <Link href="/auth/register" className="text-primary-500 hover:text-primary-600 font-medium">
                立即注册
              </Link>
            </p>
          </div>

          {/* 提示信息 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 新用户注册即送100积分
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
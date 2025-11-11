'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'
import toast from 'react-hot-toast'
import { ArrowLeft, Upload, CheckCircle, QrCode, CreditCard } from 'lucide-react'
import BottomNav from '@/components/BottomNav'

export default function Recharge() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat')
  const [proofImage, setProofImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [orders, setOrders] = useState<any[]>([])

  // 充值套餐
  const plans = [
    { id: 'A', amount: 100, points: 1000, bonus: 5, total: 1005 },
    { id: 'B', amount: 200, points: 2000, bonus: 20, total: 2020 },
    { id: 'C', amount: 300, points: 3000, bonus: 50, total: 3050 },
    { id: 'D', amount: 500, points: 5000, bonus: 200, total: 5200 },
  ]

  // 收款二维码（实际项目中应该从后端获取）
  const qrCodes = {
    wechat: 'https://via.placeholder.com/200x200?text=微信收款码',
    alipay: 'https://via.placeholder.com/200x200?text=支付宝收款码'
  }

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const userData = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      setUser(userData.data)
      loadOrders(userData.data.id)
    } else {
      router.push('/auth/login')
    }
  }

  const loadOrders = async (userId: number) => {
    try {
      const { data } = await supabase
        .from('recharge_orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      setOrders(data || [])
    } catch (error) {
      console.error('加载订单失败:', error)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 检查文件大小
      if (file.size > 2 * 1024 * 1024) {
        toast.error('图片大小不能超过2MB')
        return
      }

      // 检查文件类型
      if (!['image/jpeg', 'image/png', 'image/heic'].includes(file.type)) {
        toast.error('只支持JPG、PNG、HEIC格式的图片')
        return
      }

      setProofImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('请先登录')
      return
    }

    // 验证表单
    let amount = 0
    let points = 0
    let bonus = 0

    if (selectedPlan) {
      const plan = plans.find(p => p.id === selectedPlan)
      if (plan) {
        amount = plan.amount
        points = plan.points
        bonus = plan.bonus
      }
    } else if (customAmount) {
      amount = parseFloat(customAmount)
      if (amount < 1) {
        toast.error('最小充值金额为1元')
        return
      }
      points = amount * 10 // 1元=10积分
      bonus = 0
    } else {
      toast.error('请选择充值套餐或输入自定义金额')
      return
    }

    if (!proofImage) {
      toast.error('请上传付款截图')
      return
    }

    setLoading(true)
    try {
      // 上传图片到Supabase Storage
      const fileName = `recharge-proof/${Date.now()}-${user.id}.${proofImage.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage
        .from('finance-proof')
        .upload(fileName, proofImage)

      if (uploadError) throw uploadError

      // 获取图片URL
      const { data: { publicUrl } } = supabase.storage
        .from('finance-proof')
        .getPublicUrl(fileName)

      // 创建充值订单
      const { error: orderError } = await supabase
        .from('recharge_orders')
        .insert({
          user_id: user.id,
          amount,
          points,
          bonus_points: bonus,
          payment_method: paymentMethod,
          proof_image_url: publicUrl,
          status: 0 // 待审核
        })

      if (orderError) throw orderError

      // 发送短信通知管理员（这里简化处理）
      console.log('发送充值通知给管理员')

      toast.success('充值申请已提交，等待审核')

      // 重置表单
      setSelectedPlan('')
      setCustomAmount('')
      setPaymentMethod('wechat')
      setProofImage(null)
      setImagePreview('')

      // 刷新订单列表
      loadOrders(user.id)

    } catch (error) {
      console.error('提交失败:', error)
      toast.error('提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">正在加载...</p>
        </div>
      </div>
    )
  }

  const currentAmount = selectedPlan
    ? plans.find(p => p.id === selectedPlan)?.amount || 0
    : parseFloat(customAmount) || 0

  const currentPoints = selectedPlan
    ? plans.find(p => p.id === selectedPlan)?.total || (parseFloat(customAmount) || 0) * 10
    : (parseFloat(customAmount) || 0) * 10

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => router.back()}
            className="mr-3"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">充值中心</h1>
        </div>
      </div>

      {/* 用户积分信息 */}
      <div className="bg-primary-50 px-4 py-3 border-b border-primary-100">
        <div className="flex items-center justify-between">
          <span className="text-primary-700 font-medium">
            当前积分: {user.points}
          </span>
          <span className="text-primary-600 text-sm">
            充值比例: 1元 = 10积分
          </span>
        </div>
      </div>

      {/* 充值表单 */}
      <form onSubmit={handleSubmit} className="px-4 pb-20">
        <div className="bg-white rounded-lg shadow-sm p-4 mt-4 space-y-6">
          {/* 充值套餐 */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">选择套餐</h3>
            <div className="grid grid-cols-2 gap-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlan(plan.id)
                    setCustomAmount('')
                  }}
                  className={`p-3 border rounded-lg transition-colors ${
                    selectedPlan === plan.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg font-bold text-primary-600">
                    ¥{plan.amount}
                  </div>
                  <div className="text-sm text-gray-600">
                    {plan.points}积分
                  </div>
                  {plan.bonus > 0 && (
                    <div className="text-xs text-green-600 mt-1">
                      +{plan.bonus}赠送
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 自定义金额 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              或自定义金额
            </label>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value)
                setSelectedPlan('')
              }}
              placeholder="请输入充值金额（元）"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min="1"
              step="1"
            />
            {customAmount && (
              <p className="mt-1 text-sm text-gray-600">
                可获得 {parseFloat(customAmount) * 10} 积分
              </p>
            )}
          </div>

          {/* 支付方式 */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">选择支付方式</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('wechat')}
                className={`p-3 border rounded-lg transition-colors ${
                  paymentMethod === 'wechat'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-medium">微信支付</div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('alipay')}
                className={`p-3 border rounded-lg transition-colors ${
                  paymentMethod === 'alipay'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-medium">支付宝</div>
              </button>
            </div>
          </div>

          {/* 收款二维码 */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">扫码支付</h3>
            <div className="text-center">
              <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                <img
                  src={qrCodes[paymentMethod]}
                  alt={`${paymentMethod === 'wechat' ? '微信' : '支付宝'}收款码`}
                  className="w-32 h-32 mx-auto"
                />
              </div>
              <p className="mt-2 text-sm text-gray-600">
                请使用{paymentMethod === 'wechat' ? '微信' : '支付宝'}扫描二维码支付
              </p>
            </div>
          </div>

          {/* 上传付款截图 */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">上传付款截图</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="付款截图"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setProofImage(null)
                      setImagePreview('')
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      点击上传付款截图
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      支持 JPG、PNG、HEIC 格式，最大2MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/heic"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* 充值信息汇总 */}
          {(currentAmount > 0) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">充值信息</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">充值金额:</span>
                  <span className="font-medium">¥{currentAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">基础积分:</span>
                  <span className="font-medium">{currentAmount * 10}</span>
                </div>
                {selectedPlan && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">赠送积分:</span>
                    <span className="font-medium text-green-600">
                      +{plans.find(p => p.id === selectedPlan)?.bonus || 0}
                    </span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-medium">总计积分:</span>
                  <span className="font-bold text-primary-600">{currentPoints}</span>
                </div>
              </div>
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading || !proofImage || currentAmount === 0}
            className="w-full py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                提交中...
              </div>
            ) : (
              '提交充值申请'
            )}
          </button>
        </div>

        {/* 充值说明 */}
        <div className="bg-blue-50 rounded-lg p-4 mt-4">
          <h3 className="font-medium text-blue-900 mb-2">充值说明</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 充值比例：1元 = 10积分</li>
            <li>• 充值后需人工审核，审核通过后积分到账</li>
            <li>• 请确保付款截图清晰完整</li>
            <li>• 如有问题请联系客服</li>
          </ul>
        </div>
      </form>

      {/* 底部导航 */}
      <BottomNav user={user} />
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'
import toast from 'react-hot-toast'
import { ArrowLeft, Plus, X, Zap } from 'lucide-react'
import BottomNav from '@/components/BottomNav'

export default function NewPost() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [batchMode, setBatchMode] = useState(false)

  // 单条发布表单
  const [singleForm, setSingleForm] = useState({
    title: '',
    keywords: '',
    price: '',
    trade_type: '2' as '1' | '2' | '3' | '4',
    delivery_date: '',
    extra_info: ''
  })

  // 批量发布表单
  const [batchForm, setBatchForm] = useState({
    trade_type: '2' as '1' | '2' | '3' | '4',
    contact_method: 'wechat',
    raw_description: '',
    parsed_items: [] as any[]
  })

  const tradeTypes = [
    { value: '1', label: '求购', icon: '🛒' },
    { value: '2', label: '出售', icon: '💰' },
    { value: '3', label: '做多', icon: '📈' },
    { value: '4', label: '做空', icon: '📉' }
  ]

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
    } else {
      router.push('/auth/login')
    }
  }

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('请先登录')
      return
    }

    if (user.points < 10) {
      toast.error('积分不足，发布需要10积分')
      return
    }

    // 验证表单
    if (!singleForm.title || !singleForm.keywords || !singleForm.price) {
      toast.error('请填写必填信息')
      return
    }

    if ((singleForm.trade_type === '3' || singleForm.trade_type === '4') &&
        (!singleForm.delivery_date || !singleForm.extra_info)) {
      toast.error('做多/做空必须填写交割时间和补充信息')
      return
    }

    setLoading(true)
    try {
      // 扣除积分
      const { error: pointsError } = await supabase.rpc('deduct_points', {
        user_id: user.id,
        amount: 10,
        description: `发布信息：${singleForm.title}`
      })

      if (pointsError) throw pointsError

      // 创建帖子
      const expireAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: singleForm.title,
          keywords: singleForm.keywords,
          price: parseFloat(singleForm.price),
          trade_type: parseInt(singleForm.trade_type),
          delivery_date: singleForm.delivery_date || null,
          extra_info: singleForm.extra_info || null,
          view_limit: 10,
          view_count: 0,
          deal_count: 0,
          status: 1,
          expire_at: expireAt
        })

      if (postError) throw postError

      toast.success('发布成功！信息已上线')
      router.push('/')

    } catch (error) {
      console.error('发布失败:', error)
      toast.error('发布失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleBatchParse = async () => {
    if (!batchForm.raw_description.trim()) {
      toast.error('请输入要解析的内容')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/posts/batch-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: batchForm.raw_description,
          trade_type: batchForm.trade_type,
          contact_method: batchForm.contact_method
        })
      })

      const data = await response.json()
      if (data.success) {
        setBatchForm({ ...batchForm, parsed_items: data.items })
        toast.success(`成功解析出${data.items.length}条信息`)
      } else {
        toast.error(data.message || '解析失败')
      }
    } catch (error) {
      toast.error('解析失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleBatchSubmit = async () => {
    if (!user || batchForm.parsed_items.length === 0) {
      toast.error('没有可发布的信息')
      return
    }

    const totalPoints = batchForm.parsed_items.length * 10
    if (user.points < totalPoints) {
      toast.error(`积分不足，需要${totalPoints}积分`)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/posts/batch-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: batchForm.parsed_items,
          user_id: user.id
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`批量发布成功！共发布${data.count}条信息`)
        router.push('/')
      } else {
        toast.error(data.message || '发布失败')
      }
    } catch (error) {
      toast.error('发布失败，请重试')
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
          <h1 className="text-lg font-semibold text-gray-900">发布信息</h1>
        </div>
      </div>

      {/* 用户积分信息 */}
      <div className="bg-primary-50 px-4 py-3 border-b border-primary-100">
        <div className="flex items-center justify-between">
          <span className="text-primary-700 font-medium">
            可用积分: {user.points}
          </span>
          <span className="text-primary-600 text-sm">
            发布扣除10积分
          </span>
        </div>
      </div>

      {/* 发布模式切换 */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          <div className="flex">
            <button
              onClick={() => setBatchMode(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !batchMode
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              单条发布
            </button>
            <button
              onClick={() => setBatchMode(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                batchMode
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <Zap className="w-4 h-4" />
              AI批量发布
            </button>
          </div>
        </div>
      </div>

      {/* 单条发布表单 */}
      {!batchMode ? (
        <form onSubmit={handleSingleSubmit} className="px-4 pb-20">
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
            {/* 交易类型选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                交易类型 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {tradeTypes.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSingleForm({ ...singleForm, trade_type: type.value as any })}
                    className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                      singleForm.trade_type === type.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg mb-1">{type.icon}</div>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 标题 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={singleForm.title}
                onChange={(e) => setSingleForm({ ...singleForm, title: e.target.value })}
                placeholder="请输入标题（30字以内）"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                maxLength={30}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                {singleForm.title.length}/30
              </p>
            </div>

            {/* 关键词 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                关键词 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={singleForm.keywords}
                onChange={(e) => setSingleForm({ ...singleForm, keywords: e.target.value })}
                placeholder="请输入关键词，用英文逗号分隔"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                例如：演唱会,门票,成都
              </p>
            </div>

            {/* 价格 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                价格 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  ¥
                </span>
                <input
                  type="number"
                  value={singleForm.price}
                  onChange={(e) => setSingleForm({ ...singleForm, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* 交割时间（做多/做空时显示） */}
            {(singleForm.trade_type === '3' || singleForm.trade_type === '4') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    交割时间 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={singleForm.delivery_date}
                    onChange={(e) => setSingleForm({ ...singleForm, delivery_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    补充信息 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={singleForm.extra_info}
                    onChange={(e) => setSingleForm({ ...singleForm, extra_info: e.target.value })}
                    placeholder="请补充相关信息（20字以内）"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={2}
                    maxLength={20}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {singleForm.extra_info?.length || 0}/20
                  </p>
                </div>
              </>
            )}

            {/* 联系方式显示 */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">联系方式：</span>
                {user.wechat_id}（注册时设置，不可修改）
              </p>
            </div>
          </div>

          {/* 发布按钮 */}
          <button
            type="submit"
            disabled={loading || user.points < 10}
            className="w-full mt-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                发布中...
              </div>
            ) : (
              `支付10积分并发布`
            )}
          </button>
        </form>
      ) : (
        /* 批量发布表单 */
        <div className="px-4 pb-20">
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
            {/* 交易类型选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                交易类型 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {tradeTypes.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setBatchForm({ ...batchForm, trade_type: type.value as any })}
                    className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                      batchForm.trade_type === type.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg mb-1">{type.icon}</div>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 联系方式 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                联系方式
              </label>
              <select
                value={batchForm.contact_method}
                onChange={(e) => setBatchForm({ ...batchForm, contact_method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="wechat">微信号</option>
                <option value="phone">手机号</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                将统一使用 {user.wechat_id} 作为联系方式
              </p>
            </div>

            {/* 原始描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                原始描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={batchForm.raw_description}
                onChange={(e) => setBatchForm({ ...batchForm, raw_description: e.target.value })}
                placeholder="请粘贴要批量发布的信息，例如：&#10;成都周深演唱会 399元&#10;上海周杰伦门票 880元&#10;北京林俊杰见面会 599元"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={8}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                每行一条信息，AI会自动解析标题和价格
              </p>
            </div>

            {/* 解析按钮 */}
            <button
              type="button"
              onClick={handleBatchParse}
              disabled={loading || !batchForm.raw_description.trim()}
              className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  解析中...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  AI智能解析
                </>
              )}
            </button>

            {/* 解析结果 */}
            {batchForm.parsed_items.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">
                  解析结果 ({batchForm.parsed_items.length}条)
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {batchForm.parsed_items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600">¥{item.price}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = batchForm.parsed_items.filter((_, i) => i !== index)
                          setBatchForm({ ...batchForm, parsed_items: newItems })
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 批量发布按钮 */}
          {batchForm.parsed_items.length > 0 && (
            <button
              type="button"
              onClick={handleBatchSubmit}
              disabled={loading || user.points < batchForm.parsed_items.length * 10}
              className="w-full mt-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  发布中...
                </div>
              ) : (
                `批量发布${batchForm.parsed_items.length}条信息（需${batchForm.parsed_items.length * 10}积分）`
              )}
            </button>
          )}
        </div>
      )}

      {/* 底部导航 */}
      <BottomNav user={user} />
    </div>
  )
}
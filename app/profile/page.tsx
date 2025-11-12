'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User, Post, PointTransaction, ViewRecord } from '@/types'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  User as UserIcon,
  Coins,
  TrendingUp,
  FileText,
  History,
  CreditCard,
  Settings,
  ChevronRight,
  Star,
  Eye,
  Share2,
  ArrowDown,
  ArrowUp,
  Copy
} from 'lucide-react'
import BottomNav from '@/components/BottomNav'

export default function Profile() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [myPosts, setMyPosts] = useState<Post[]>([])
  const [myViews, setMyViews] = useState<ViewRecord[]>([])
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [loading, setLoading] = useState(true)

  const tabs = [
    { name: '我的发布', icon: FileText },
    { name: '我的足迹', icon: History },
    { name: '积分明细', icon: CreditCard },
  ]

  useEffect(() => {
    checkUser()
  }, [activeTab])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const userData = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      setUser(userData.data)
      loadUserData(userData.data.id)
    } else {
      router.push('/auth/login')
    }
  }

  const loadUserData = async (userId: number) => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 0: // 我的发布
          const { data: posts } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
          setMyPosts(posts || [])
          break
        case 1: // 我的足迹
          const { data: views } = await supabase
            .from('view_records')
            .select(`
              *,
              post:posts(
                id,
                title,
                price,
                trade_type,
                expire_at,
                user:users(
                  wechat_id,
                  deal_rate
                )
              )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
          setMyViews(views || [])
          break
        case 2: // 积分明细
          const { data: txns } = await supabase
            .from('point_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
          setTransactions(txns || [])
          break
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePostAction = async (postId: number, action: 'offline' | 'online') => {
    try {
      const updates = action === 'offline' ? { status: 0 } : {
        status: 1,
        expire_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
      }

      const { error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', postId)

      if (error) throw error

      toast.success(action === 'offline' ? '已下架' : '已重新上架')
      loadUserData(user!.id)
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleCopyContact = async (wechatId: string) => {
    try {
      await navigator.clipboard.writeText(wechatId)
      toast.success('联系方式已复制')
    } catch (error) {
      toast.error('复制失败')
    }
  }

  const handleConfirmDeal = async (viewId: number) => {
    try {
      const { error } = await supabase
        .from('view_records')
        .update({
          confirmed_deal: true,
          deal_confirmed_at: new Date().toISOString()
        })
        .eq('id', viewId)

      if (error) throw error
      toast.success('已确认成交')
      loadUserData(user!.id)
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleCopyInviteCode = async () => {
    if (!user?.invite_code) return

    try {
      await navigator.clipboard.writeText(user.invite_code)
      toast.success('邀请码已复制')
    } catch (error) {
      toast.error('复制失败')
    }
  }

  const getTransactionIcon = (type: number) => {
    switch (type) {
      case 1: return <ArrowDown className="w-4 h-4 text-green-500" />
      case 2: case 3: return <ArrowUp className="w-4 h-4 text-red-500" />
      case 4: case 5: return <ArrowDown className="w-4 h-4 text-green-500" />
      default: return <Coins className="w-4 h-4" />
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
      {/* 顶部个人信息 */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white p-6">
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <UserIcon className="w-8 h-8" />
          </div>
          <div className="ml-4 flex-1">
            <h2 className="text-xl font-semibold mb-1">{user.wechat_id}</h2>
            <p className="text-primary-100 text-sm">ID: {user.id}</p>
          </div>
        </div>

        {/* 数据统计 */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{user.points}</div>
            <div className="text-primary-100 text-xs">积分余额</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{user.deal_rate}%</div>
            <div className="text-primary-100 text-xs">成交率</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{user.total_posts}</div>
            <div className="text-primary-100 text-xs">发布数</div>
          </div>
        </div>

        {/* 邀请码 */}
        <div
          onClick={handleCopyInviteCode}
          className="bg-white/10 rounded-lg p-3 flex items-center justify-between cursor-pointer"
        >
          <div>
            <div className="text-sm text-primary-100">邀请码</div>
            <div className="font-mono font-semibold">{user.invite_code}</div>
          </div>
          <Copy className="w-4 h-4 text-primary-200" />
        </div>
      </div>

      {/* 功能入口 */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-lg shadow-sm">
          <button
            onClick={() => router.push('/recharge')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 text-primary-500 mr-3" />
              <span className="font-medium">充值中心</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          <div className="border-t border-gray-100" />
          <button
            onClick={() => router.push('/settings')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <Settings className="w-5 h-5 text-primary-500 mr-3" />
              <span className="font-medium">设置</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* 标签页 */}
      <div className="px-4">
        <div className="bg-white rounded-lg shadow-sm p-1">
          <div className="flex">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === index
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4 inline mr-1" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="px-4 pb-20 mt-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* 我的发布 */}
            {activeTab === 0 && (
              <div className="space-y-3">
                {myPosts.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-lg">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">还没有发布任何信息</p>
                    <button
                      onClick={() => router.push('/posts/new')}
                      className="mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm"
                    >
                      去发布
                    </button>
                  </div>
                ) : (
                  myPosts.map((post) => (
                    <div key={post.id} className="bg-white rounded-lg shadow-sm p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">{post.title}</h3>
                          <p className="text-lg font-semibold text-red-600">¥{post.price}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500">
                              查看 {post.view_count}/{post.view_limit}
                            </span>
                            <span className="text-xs text-gray-500">
                              成交 {post.deal_count}
                            </span>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          post.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {post.status === 1 ? '上架中' : '已下架'}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>{formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                          locale: zhCN
                        })}</span>
                        <span>{post.expire_at > new Date().toISOString() ? '有效' : '已过期'}</span>
                      </div>

                      <div className="flex gap-2">
                        {post.status === 1 ? (
                          <button
                            onClick={() => handlePostAction(post.id, 'offline')}
                            className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                          >
                            下架
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePostAction(post.id, 'online')}
                            className="flex-1 py-2 bg-primary-100 text-primary-700 rounded-lg text-sm hover:bg-primary-200 transition-colors"
                          >
                            重新上架
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/posts/${post.id}`)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                        >
                          查看
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 我的足迹 */}
            {activeTab === 1 && (
              <div className="space-y-3">
                {myViews.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-lg">
                    <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">还没有查看过任何信息</p>
                  </div>
                ) : (
                  myViews.map((view) => (
                    <div key={view.id} className="bg-white rounded-lg shadow-sm p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {view.post?.title}
                          </h3>
                          <p className="text-lg font-semibold text-red-600">
                            ¥{view.post?.price}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span>成交率 {view.post?.user?.deal_rate}%</span>
                            <span>•</span>
                            <span>{view.post?.user?.wechat_id}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>{formatDistanceToNow(new Date(view.created_at), {
                          addSuffix: true,
                          locale: zhCN
                        })}</span>
                        {view.confirmed_deal && (
                          <span className="text-green-600">已成交</span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopyContact(view.post?.user?.wechat_id || '')}
                          className="flex-1 py-2 bg-primary-100 text-primary-700 rounded-lg text-sm hover:bg-primary-200 transition-colors flex items-center justify-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          复制联系方式
                        </button>
                        {!view.confirmed_deal && (
                          <button
                            onClick={() => handleConfirmDeal(view.id)}
                            className="px-4 py-2 border border-green-500 text-green-600 rounded-lg text-sm hover:bg-green-50 transition-colors"
                          >
                            确认成交
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 积分明细 */}
            {activeTab === 2 && (
              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-lg">
                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">还没有积分记录</p>
                  </div>
                ) : (
                  transactions.map((txn) => (
                    <div key={txn.id} className="bg-white rounded-lg shadow-sm p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            {getTransactionIcon(txn.change_type)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{txn.description}</p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(txn.created_at), {
                                addSuffix: true,
                                locale: zhCN
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            txn.change_amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {txn.change_amount > 0 ? '+' : ''}{txn.change_amount}
                          </p>
                          <p className="text-xs text-gray-500">
                            余额: {txn.balance_after}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 底部导航 */}
      <BottomNav user={user} />
    </div>
  )
}
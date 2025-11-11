'use client'

import { useState } from 'react'
import { Post, User, TradeTypeMap } from '@/types'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { Eye, Clock, User as UserIcon, Copy } from 'lucide-react'

interface PostCardProps {
  post: Post & { user?: any }
  user: User | null
}

export default function PostCard({ post, user }: PostCardProps) {
  const [loading, setLoading] = useState(false)

  const handleViewContact = async () => {
    if (!user) {
      toast.error('请先登录')
      return
    }

    if (user.points < 1) {
      toast.error('积分不足，请先充值')
      return
    }

    if (post.user_id === user.id) {
      toast.error('不能查看自己的联系方式')
      return
    }

    setLoading(true)
    try {
      // 检查是否已经查看过
      const { data: existingView } = await supabase
        .from('view_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('post_id', post.id)
        .single()

      if (existingView) {
        // 已经查看过，直接显示联系方式
        await navigator.clipboard.writeText(post.user.wechat_id)
        toast.success('微信号已复制到剪贴板')
        return
      }

      // 扣除积分并记录查看
      const { error: pointsError } = await supabase.rpc('deduct_points', {
        user_id: user.id,
        amount: 1,
        description: `查看联系方式：${post.title}`
      })

      if (pointsError) throw pointsError

      // 记录查看
      const { error: viewError } = await supabase
        .from('view_records')
        .insert({
          user_id: user.id,
          post_id: post.id,
          points_cost: 1
        })

      if (viewError) throw viewError

      // 更新帖子查看次数
      const { error: postError } = await supabase
        .from('posts')
        .update({ view_count: post.view_count + 1 })
        .eq('id', post.id)

      if (postError) throw postError

      // 复制微信号
      await navigator.clipboard.writeText(post.user.wechat_id)
      toast.success('查看成功，微信号已复制到剪贴板')

      // 24小时后询问成交状态
      setTimeout(() => {
        toast.success('请确认是否已成交？', {
          duration: 5000,
        })
      }, 24 * 60 * 60 * 1000)

    } catch (error) {
      console.error('查看联系方式失败:', error)
      toast.error('查看失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const getRemainingViews = () => {
    return post.view_limit - post.view_count
  }

  const getProgressWidth = () => {
    return (post.view_count / post.view_limit) * 100
  }

  return (
    <div className="bg-white rounded-lg shadow-card p-4 hover:shadow-card-hover transition-shadow">
      {/* 顶部信息 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${TradeTypeMap[post.trade_type].color}`}>
              {TradeTypeMap[post.trade_type].name}
            </span>
            {getRemainingViews() <= 2 && (
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                即将下架
              </span>
            )}
          </div>
          <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">
            {post.title}
          </h3>
          <p className="text-2xl font-bold text-red-600">
            ¥{post.price.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 关键词 */}
      <div className="flex flex-wrap gap-1 mb-3">
        {post.keywords.split(',').slice(0, 3).map((keyword, index) => (
          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
            {keyword.trim()}
          </span>
        ))}
      </div>

      {/* 发布者信息 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
            <UserIcon className="w-3 h-3 text-gray-600" />
          </div>
          <div className="text-xs text-gray-600">
            <span className="font-medium">成交率 {post.user?.deal_rate || 0}%</span>
            <span className="ml-2">发布 {post.user?.total_posts || 0} 条</span>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(post.created_at), {
            addSuffix: true,
            locale: zhCN
          })}
        </div>
      </div>

      {/* 查看进度 */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            查看 {post.view_count}/{post.view_limit}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            剩余 {getRemainingViews()} 次
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgressWidth()}%` }}
          />
        </div>
      </div>

      {/* 查看联系方式按钮 */}
      <button
        onClick={handleViewContact}
        disabled={loading || getRemainingViews() === 0}
        className="w-full py-2 bg-primary-500 text-white rounded-lg text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            处理中...
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            查看联系方式 (1积分)
          </>
        )}
      </button>
    </div>
  )
}
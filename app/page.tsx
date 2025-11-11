'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Post, User, Announcement } from '@/types'
import PostCard from '@/components/PostCard'
import SearchBar from '@/components/SearchBar'
import CategoryTabs from '@/components/CategoryTabs'
import BottomNav from '@/components/BottomNav'
import AnnouncementBar from '@/components/AnnouncementBar'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  useEffect(() => {
    // 检查用户登录状态
    checkUser()
    // 加载公告
    loadAnnouncements()
    // 加载帖子
    loadPosts()
  }, [activeTab, searchKeyword])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const userData = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      setUser(userData.data)
    }
  }

  const loadAnnouncements = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('status', 1)
      .order('priority', { ascending: false })
      .limit(1)
    setAnnouncements(data || [])
  }

  const loadPosts = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          user:users(
            id,
            wechat_id,
            deal_rate,
            total_posts
          )
        `)
        .eq('status', 1)
        .gt('expire_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      // 按分类筛选
      const tradeTypes = [null, 1, 2, 3, 4] // 全部、求购、出售、做多、做空
      if (tradeTypes[activeTab]) {
        query = query.eq('trade_type', tradeTypes[activeTab])
      }

      // 关键词搜索
      if (searchKeyword) {
        query = query.or(`title.ilike.%${searchKeyword}%,keywords.ilike.%${searchKeyword}%`)
      }

      const { data } = await query.limit(20)
      setPosts(data || [])
    } catch (error) {
      console.error('加载帖子失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">交易信息撮合平台</h1>
        </div>
      </div>

      {/* 公告栏 */}
      {announcements.length > 0 && (
        <AnnouncementBar announcements={announcements} />
      )}

      {/* 搜索栏 */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <SearchBar onSearch={setSearchKeyword} />
      </div>

      {/* 分类标签 */}
      <div className="px-4 py-2 bg-white border-b border-gray-100">
        <CategoryTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* 帖子列表 */}
      <div className="flex-1 pb-16">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-400 text-sm">暂无信息</div>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} user={user} />
            ))}
          </div>
        )}
      </div>

      {/* 底部导航 */}
      <BottomNav user={user} />
    </div>
  )
}
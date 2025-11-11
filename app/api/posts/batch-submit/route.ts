import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { items, user_id } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: false,
        message: '没有可发布的信息'
      })
    }

    // 检查用户积分
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('points')
      .eq('id', user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        message: '用户不存在'
      })
    }

    const totalPoints = items.length * 10
    if (user.points < totalPoints) {
      return NextResponse.json({
        success: false,
        message: `积分不足，需要${totalPoints}积分，当前只有${user.points}积分`
      })
    }

    // 批量插入帖子
    const expireAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

    const postsData = items.map(item => ({
      user_id,
      title: item.title,
      keywords: item.keywords || '',
      price: parseFloat(item.price),
      trade_type: item.trade_type,
      delivery_date: item.delivery_date || null,
      extra_info: item.extra_info || null,
      view_limit: 10,
      view_count: 0,
      deal_count: 0,
      status: 1,
      expire_at: expireAt
    }))

    // 扣除积分
    const { error: pointsError } = await supabase.rpc('deduct_points', {
      user_id,
      amount: totalPoints,
      description: `批量发布${items.length}条信息`
    })

    if (pointsError) throw pointsError

    // 批量插入帖子
    const { data: posts, error: insertError } = await supabase
      .from('posts')
      .insert(postsData)
      .select()

    if (insertError) throw insertError

    return NextResponse.json({
      success: true,
      message: `成功发布${posts.length}条信息`,
      count: posts.length
    })

  } catch (error) {
    console.error('批量发布失败:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : '发布失败，请重试'
    })
  }
}
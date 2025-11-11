export interface User {
  id: number
  phone: string
  wechat_id: string
  invite_code?: string
  points: number
  deal_rate: number
  total_posts: number
  total_deals: number
  status: number
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Post {
  id: number
  user_id: number
  title: string
  keywords: string
  price: number
  trade_type: 1 | 2 | 3 | 4 // 1:求购 2:出售 3:做多 4:做空
  delivery_date?: string
  extra_info?: string
  view_limit: number
  view_count: number
  deal_count: number
  status: number
  expire_at: string
  created_at: string
  updated_at: string
  user?: User
}

export interface PointTransaction {
  id: number
  user_id: number
  change_type: 1 | 2 | 3 | 4 | 5 // 1:充值 2:发布 3:查看 4:奖励 5:退还
  change_amount: number
  balance_after: number
  related_id?: number
  description: string
  order_id?: string
  created_at: string
}

export interface ViewRecord {
  id: number
  user_id: number
  post_id: number
  points_cost: number
  confirmed_deal: boolean
  deal_confirmed_at?: string
  created_at: string
}

export interface RechargeOrder {
  id: number
  order_id: string
  user_id: number
  amount: number
  points: number
  bonus_points: number
  payment_method: 'wechat' | 'alipay'
  proof_image_url?: string
  status: 0 | 1 | 2 // 0:待审核 1:已确认 2:已驳回
  admin_note?: string
  reviewed_by?: number
  reviewed_at?: string
  created_at: string
}

export interface Announcement {
  id: number
  title: string
  content: string
  priority: number
  status: number
  created_at: string
  updated_at: string
}

export interface SmsCode {
  id: number
  phone: string
  code: string
  attempts: number
  status: number
  expires_at: string
  created_at: string
}

// 交易类型映射
export const TradeTypeMap = {
  1: { name: '求购', color: 'bg-blue-100 text-blue-800' },
  2: { name: '出售', color: 'bg-green-100 text-green-800' },
  3: { name: '做多', color: 'bg-red-100 text-red-800' },
  4: { name: '做空', color: 'bg-purple-100 text-purple-800' },
}

// 积分变化类型映射
export const PointChangeTypeMap = {
  1: { name: '充值', color: 'text-green-600' },
  2: { name: '发布信息', color: 'text-red-600' },
  3: { name: '查看联系方式', color: 'text-red-600' },
  4: { name: '邀请奖励', color: 'text-green-600' },
  5: { name: '下架退还', color: 'text-green-600' },
}

// 订单状态映射
export const OrderStatusMap = {
  0: { name: '待审核', color: 'bg-yellow-100 text-yellow-800' },
  1: { name: '已确认', color: 'bg-green-100 text-green-800' },
  2: { name: '已驳回', color: 'bg-red-100 text-red-800' },
}
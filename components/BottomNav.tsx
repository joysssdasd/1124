'use client'

import { useRouter } from 'next/navigation'
import { User, PlusCircle, Home, UserCircle } from 'lucide-react'
import { User as UserType } from '@/types'

interface BottomNavProps {
  user: UserType | null
}

export default function BottomNav({ user }: BottomNavProps) {
  const router = useRouter()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex items-center justify-around py-2">
        <button
          onClick={() => router.push('/')}
          className="flex flex-col items-center py-2 px-4 text-gray-600 hover:text-primary-500 transition-colors"
        >
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1">首页</span>
        </button>

        <button
          onClick={() => router.push(user ? '/posts/new' : '/auth/login')}
          className="flex flex-col items-center py-2 px-4 text-gray-600 hover:text-primary-500 transition-colors"
        >
          <div className="relative">
            <PlusCircle className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">+</span>
            </div>
          </div>
          <span className="text-xs mt-1">发布</span>
        </button>

        <button
          onClick={() => router.push(user ? '/profile' : '/auth/login')}
          className="flex flex-col items-center py-2 px-4 text-gray-600 hover:text-primary-500 transition-colors"
        >
          <div className="relative">
            <UserCircle className="w-6 h-6" />
            {user && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <span className="text-xs mt-1">
            {user ? '我的' : '登录'}
          </span>
        </button>
      </div>
    </div>
  )
}
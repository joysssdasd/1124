'use client'

import { useState, useEffect } from 'react'
import { X, Megaphone } from 'lucide-react'
import { Announcement } from '@/types'

interface AnnouncementBarProps {
  announcements: Announcement[]
}

export default function AnnouncementBar({ announcements }: AnnouncementBarProps) {
  const [visible, setVisible] = useState(true)
  const [closedIds, setClosedIds] = useState<string[]>([])

  useEffect(() => {
    const savedClosedIds = localStorage.getItem('closedAnnouncements')
    if (savedClosedIds) {
      setClosedIds(JSON.parse(savedClosedIds))
    }
  }, [])

  const visibleAnnouncements = announcements.filter(a => !closedIds.includes(a.id.toString()))

  if (!visible || visibleAnnouncements.length === 0) {
    return null
  }

  const handleClose = (id: number) => {
    const newClosedIds = [...closedIds, id.toString()]
    setClosedIds(newClosedIds)
    localStorage.setItem('closedAnnouncements', JSON.stringify(newClosedIds))

    if (newClosedIds.length >= visibleAnnouncements.length) {
      setVisible(false)
    }
  }

  return (
    <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
      <div className="px-4 py-2">
        {visibleAnnouncements.map((announcement, index) => (
          <div key={announcement.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1">
              <Megaphone className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm line-clamp-1">
                {announcement.content}
              </p>
            </div>
            <button
              onClick={() => handleClose(announcement.id)}
              className="ml-2 text-white hover:text-primary-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
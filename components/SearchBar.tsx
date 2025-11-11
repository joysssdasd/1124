'use client'

import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'

interface SearchBarProps {
  onSearch: (keyword: string) => void
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [keyword, setKeyword] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory')
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowHistory(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (searchKeyword: string) => {
    if (searchKeyword.trim()) {
      const newHistory = [searchKeyword, ...history.filter(h => h !== searchKeyword)].slice(0, 5)
      setHistory(newHistory)
      localStorage.setItem('searchHistory', JSON.stringify(newHistory))
    }
    onSearch(searchKeyword)
    setShowHistory(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(keyword)
  }

  const handleHistoryClick = (historyKeyword: string) => {
    setKeyword(historyKeyword)
    handleSearch(historyKeyword)
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('searchHistory')
  }

  return (
    <div ref={searchRef} className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onFocus={() => setShowHistory(true)}
            placeholder="搜索交易信息..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
        </div>
      </form>

      {/* 搜索历史 */}
      {showHistory && history.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">搜索历史</span>
              <button
                onClick={clearHistory}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                清空
              </button>
            </div>
            {history.map((item, index) => (
              <button
                key={index}
                onClick={() => handleHistoryClick(item)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                <Search className="inline w-3 h-3 mr-2 text-gray-400" />
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
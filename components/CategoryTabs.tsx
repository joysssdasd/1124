'use client'

interface CategoryTabsProps {
  activeTab: number
  onTabChange: (tab: number) => void
}

export default function CategoryTabs({ activeTab, onTabChange }: CategoryTabsProps) {
  const categories = [
    { name: '全部', icon: '📋' },
    { name: '求购', icon: '🛒' },
    { name: '出售', icon: '💰' },
    { name: '做多', icon: '📈' },
    { name: '做空', icon: '📉' },
  ]

  return (
    <div className="flex space-x-1 overflow-x-auto no-scrollbar">
      {categories.map((category, index) => (
        <button
          key={index}
          onClick={() => onTabChange(index)}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
            ${activeTab === index
              ? 'bg-primary-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          <span className="mr-1">{category.icon}</span>
          {category.name}
        </button>
      ))}
    </div>
  )
}
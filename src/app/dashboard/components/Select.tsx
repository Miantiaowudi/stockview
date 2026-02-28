'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'

interface SelectOption {
  value: string
  label: string
  icon?: ReactNode
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  className?: string
}

export default function Select({ value, onChange, options, className = '' }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between gap-3 px-4 py-2.5 min-w-[180px]
          text-sm font-medium border rounded-xl cursor-pointer
          transition-all duration-200
          ${isOpen 
            ? 'border-blue-500 bg-white ring-2 ring-blue-500/20' 
            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
          }
        `}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          <span className="text-slate-700 whitespace-nowrap">{selectedOption?.label}</span>
        </span>
        <svg 
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div 
        className={`
          absolute top-full left-0 mt-2 w-full min-w-[180px] py-1.5
          bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-200/50
          z-50 overflow-hidden
          transition-all duration-200
          ${isOpen 
            ? 'opacity-100 translate-y-0 visible' 
            : 'opacity-0 -translate-y-2 invisible pointer-events-none'
          }
        `}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value)
              setIsOpen(false)
            }}
            className={`
              w-full px-4 py-2.5 text-left text-sm
              flex items-center gap-3
              transition-colors duration-150
              ${option.value === value 
                ? 'bg-blue-50 text-blue-600 font-medium' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }
            `}
          >
            {option.icon && (
              <span className="w-4 h-4 flex-shrink-0">
                {option.icon}
              </span>
            )}
            <span className="whitespace-nowrap">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

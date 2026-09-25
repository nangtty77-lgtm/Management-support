'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface SearchResult {
  type: string
  href: string
  label: string
  sub: string
  icon: string
}

const ICON_SVG: Record<string, string> = {
  check: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  crm: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  document: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8',
  employee: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  money: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  cart: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0',
}

function ResultIcon({ icon }: { icon: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {(ICON_SVG[icon] ?? ICON_SVG.document).split(' M').map((d, i) => (
        <path key={i} d={i === 0 ? d : `M${d}`} />
      ))}
    </svg>
  )
}

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results ?? [])
      setSelected(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query), 200)
    return () => clearTimeout(t)
  }, [query, search])

  function navigate(href: string) {
    router.push(href)
    onClose()
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) navigate(results[selected].href)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="검색: 업무, 고객, 계약, 직원, 매출..."
            className="flex-1 text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent"
          />
          {loading && <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />}
          <kbd className="text-[10px] text-slate-300 border border-slate-200 rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-[400px] overflow-y-auto py-2">
            {results.map((r, i) => (
              <li key={`${r.type}-${r.href}`}>
                <button
                  onClick={() => navigate(r.href)}
                  onMouseEnter={() => setSelected(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === selected ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                >
                  <span className={`shrink-0 ${i === selected ? 'text-indigo-600' : 'text-slate-400'}`}>
                    <ResultIcon icon={r.icon} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-slate-800 truncate">{r.label}</span>
                    <span className="block text-xs text-slate-400 truncate">{r.sub}</span>
                  </span>
                  {i === selected && (
                    <kbd className="text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 shrink-0">↵</kbd>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {query && !loading && results.length === 0 && (
          <div className="py-10 text-center text-slate-400 text-sm">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-2 opacity-30"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            "{query}"에 대한 검색 결과가 없습니다
          </div>
        )}

        {!query && (
          <div className="px-4 py-5 text-xs text-slate-400">
            <p className="mb-2 font-medium text-slate-500">빠른 이동</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '업무관리', href: '/tasks' },
                { label: '고객관리', href: '/crm/customers' },
                { label: '매출관리', href: '/accounting/sales' },
                { label: '계약관리', href: '/contracts' },
                { label: 'KPI 대시보드', href: '/kpi' },
              ].map(item => (
                <button key={item.href} onClick={() => navigate(item.href)}
                  className="bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-500 rounded-lg px-3 py-1.5 transition-colors">
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400">
          <span><kbd className="border border-slate-200 rounded px-1 bg-white">↑</kbd> <kbd className="border border-slate-200 rounded px-1 bg-white">↓</kbd> 이동</span>
          <span><kbd className="border border-slate-200 rounded px-1 bg-white">↵</kbd> 선택</span>
          <span><kbd className="border border-slate-200 rounded px-1 bg-white">ESC</kbd> 닫기</span>
        </div>
      </div>
    </div>
  )
}

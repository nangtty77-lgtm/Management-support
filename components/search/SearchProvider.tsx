'use client'

import { useEffect, useState } from 'react'
import { SearchModal } from './SearchModal'

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // expose open function globally for sidebar click
  useEffect(() => {
    (window as any).__openSearch = () => setOpen(true)
    return () => { delete (window as any).__openSearch }
  }, [])

  return (
    <>
      {children}
      <SearchModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

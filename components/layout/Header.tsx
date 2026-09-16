import { auth, signOut } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'

export default async function Header() {
  const session = await auth()
  const unreadCount = session?.user?.id
    ? await db.notification.count({ where: { userId: session.user.id, read: false } })
    : 0

  return (
    <header className="h-[52px] bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <Link href="/notifications" className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
            {session?.user?.name?.[0] ?? 'U'}
          </div>
          <span className="text-sm text-slate-700 font-medium">{session?.user?.name}</span>
          <span className="text-xs text-slate-400">{session?.user?.role}</span>
        </div>
        <div className="h-4 w-px bg-slate-200" />
        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/login' })
          }}
        >
          <button type="submit" className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
            로그아웃
          </button>
        </form>
      </div>
    </header>
  )
}

import { auth, signOut } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'

export default async function Header() {
  const session = await auth()
  const unreadCount = session?.user?.id
    ? await db.notification.count({ where: { userId: session.user.id, read: false } })
    : 0

  return (
    <header className="h-[50px] bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <Link href="/notifications" className="relative text-sub hover:text-navy">
          🔔
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <span className="text-sm text-sub">
          {session?.user?.name} · {session?.user?.role}
        </span>
        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/login' })
          }}
        >
          <button type="submit" className="text-sm text-sub hover:text-navy">
            로그아웃
          </button>
        </form>
      </div>
    </header>
  )
}

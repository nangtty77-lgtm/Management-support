import { auth, signOut } from '@/lib/auth'

export default async function Header() {
  const session = await auth()
  return (
    <header className="h-[50px] bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-4">
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

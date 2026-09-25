import { auth } from '@/lib/auth'
import { ProfileClient } from './ProfileClient'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) return null
  return <ProfileClient user={{ id: session.user.id, name: session.user.name ?? '', email: session.user.email ?? '', role: session.user.role }} />
}

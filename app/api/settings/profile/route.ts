import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, currentPassword, newPassword } = body

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const updates: Record<string, unknown> = {}
  if (name?.trim()) updates.name = name.trim()

  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: '현재 비밀번호를 입력해주세요' }, { status: 400 })
    if (!user.password) return NextResponse.json({ error: '비밀번호 변경 불가' }, { status: 400 })
    const ok = await bcrypt.compare(currentPassword, user.password)
    if (!ok) return NextResponse.json({ error: '현재 비밀번호가 올바르지 않습니다' }, { status: 400 })
    if (newPassword.length < 8) return NextResponse.json({ error: '비밀번호는 8자 이상이어야 합니다' }, { status: 400 })
    updates.password = await bcrypt.hash(newPassword, 12)
  }

  const updated = await db.user.update({ where: { id: session.user.id }, data: updates })
  return NextResponse.json({ name: updated.name, email: updated.email })
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { canManageContracts } from '@/lib/permissions'
import { put } from '@vercel/blob'

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/haansofthwp']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  if (!canManageContracts(session)) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: '파일 없음' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: '파일 크기 초과 (최대 10MB)' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith('.hwp')) {
    return NextResponse.json({ error: 'PDF, DOCX, HWP만 허용' }, { status: 400 })
  }

  const blob = await put(`contracts/${Date.now()}-${file.name}`, file, { access: 'public' })
  return NextResponse.json({ url: blob.url })
}

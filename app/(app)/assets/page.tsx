import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import Link from 'next/link'

const CATEGORY_LABEL: Record<string, string> = {
  IT_EQUIPMENT: 'IT장비', FURNITURE: '가구/집기', VEHICLE: '차량',
  MACHINERY: '기계', OFFICE_SUPPLIES: '사무용품', BUILDING: '건물', OTHER: '기타',
}
const STATUS_LABEL: Record<string, string> = {
  IN_USE: '사용중', IN_STORAGE: '보관중', UNDER_REPAIR: '수리중', DISPOSED: '폐기',
}
const STATUS_COLOR: Record<string, string> = {
  IN_USE: 'bg-emerald-50 text-emerald-700',
  IN_STORAGE: 'bg-blue-50 text-blue-700',
  UNDER_REPAIR: 'bg-amber-50 text-amber-700',
  DISPOSED: 'bg-slate-100 text-slate-500',
}
const CATEGORY_ICON: Record<string, string> = {
  IT_EQUIPMENT: '💻', FURNITURE: '🪑', VEHICLE: '🚗',
  MACHINERY: '⚙️', OFFICE_SUPPLIES: '📎', BUILDING: '🏢', OTHER: '📦',
}

export default async function AssetsPage() {
  const session = await auth()
  if (!session) return null

  const assets = await db.asset.findMany({
    include: { assignee: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const total = assets.length
  const inUse = assets.filter((a) => a.status === 'IN_USE').length
  const totalValue = assets
    .filter((a) => a.status !== 'DISPOSED')
    .reduce((sum, a) => sum + Number(a.currentValue ?? a.purchasePrice ?? 0), 0)

  // Group by category
  const byCategory = Object.entries(CATEGORY_LABEL).map(([cat, label]) => ({
    cat, label,
    count: assets.filter((a) => a.category === cat).length,
  })).filter((c) => c.count > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">자산관리</h1>
          <p className="text-sm text-slate-500 mt-0.5">전체 {total}건 · 사용중 {inUse}건 · 자산총액 {totalValue.toLocaleString('ko-KR')}원</p>
        </div>
        <Link href="/assets/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-1.5 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          자산 등록
        </Link>
      </div>

      {/* Category summary */}
      {byCategory.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {byCategory.map(({ cat, label, count }) => (
            <div key={cat} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
              <span className="text-2xl">{CATEGORY_ICON[cat]}</span>
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-lg font-bold text-slate-900">{count}건</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Asset list */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {assets.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <p className="text-slate-500 font-medium">등록된 자산이 없습니다</p>
            <Link href="/assets/new" className="inline-block mt-3 text-sm text-indigo-600 hover:underline">+ 자산 등록하기</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['자산명', '분류', '자산번호', '취득가액', '현재가치', '위치', '사용자', '상태'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/assets/${a.id}/edit`} className="font-medium text-slate-900 hover:text-indigo-600 hover:underline">
                      {a.name}
                    </Link>
                    {a.serialNo && <p className="text-xs text-slate-400">S/N: {a.serialNo}</p>}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    <span className="flex items-center gap-1">
                      <span>{CATEGORY_ICON[a.category]}</span>
                      {CATEGORY_LABEL[a.category]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 font-mono text-xs">{a.code || '—'}</td>
                  <td className="px-5 py-3 text-slate-700 font-medium">
                    {a.purchasePrice ? Number(a.purchasePrice).toLocaleString('ko-KR') + '원' : '—'}
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {a.currentValue ? Number(a.currentValue).toLocaleString('ko-KR') + '원' : '—'}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{a.location || '—'}</td>
                  <td className="px-5 py-3 text-slate-500">{a.assignee?.name || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[a.status]}`}>
                      {STATUS_LABEL[a.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

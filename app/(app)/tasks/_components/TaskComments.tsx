'use client'

import { useState } from 'react'

interface Comment {
  id: string
  content: string
  author: { id: string; name: string }
  createdAt: string
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return new Date(iso).toLocaleDateString('ko-KR')
}

export function TaskComments({
  taskId, initialComments, currentUserId, isAdmin,
}: {
  taskId: string; initialComments: Comment[]; currentUserId: string; isAdmin: boolean
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)

  async function postComment() {
    if (!content.trim()) return
    setPosting(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        const comment = await res.json()
        setComments(prev => [...prev, comment])
        setContent('')
      }
    } finally { setPosting(false) }
  }

  async function deleteComment(commentId: string) {
    if (!confirm('댓글을 삭제하시겠습니까?')) return
    const res = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, { method: 'DELETE' })
    if (res.ok) setComments(prev => prev.filter(c => c.id !== commentId))
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">댓글 <span className="text-slate-400 font-normal">({comments.length})</span></h2>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-sm text-slate-400 mb-4">첫 댓글을 남겨보세요</p>
      ) : (
        <div className="space-y-3 mb-4">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-indigo-600">{c.author.name[0]}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-slate-700">{c.author.name}</span>
                  <span className="text-xs text-slate-400">{timeAgo(c.createdAt)}</span>
                  {(c.author.id === currentUserId || isAdmin) && (
                    <button onClick={() => deleteComment(c.id)} className="text-[10px] text-slate-300 hover:text-red-400 transition-colors ml-auto">삭제</button>
                  )}
                </div>
                <p className="text-sm text-slate-700 mt-0.5 leading-relaxed whitespace-pre-wrap">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) postComment() }}
          placeholder="댓글 작성... (Ctrl+Enter로 전송)"
          rows={2}
          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
        <button
          onClick={postComment}
          disabled={posting || !content.trim()}
          className="self-end px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-40 transition-colors"
        >
          {posting ? '...' : '전송'}
        </button>
      </div>
    </div>
  )
}

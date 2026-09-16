import { Session } from 'next-auth'

type Role = 'ADMIN' | 'HR' | 'GENERAL' | 'OPS' | 'VIEW'

export function getRole(session: Session | null): Role {
  return (session?.user?.role as Role) ?? 'VIEW'
}

// HR module: ADMIN + HR can write, everyone else reads
export function canManageHR(session: Session | null): boolean {
  return ['ADMIN', 'HR'].includes(getRole(session))
}

// Contract module: ADMIN + GENERAL can write
export function canManageContracts(session: Session | null): boolean {
  return ['ADMIN', 'GENERAL'].includes(getRole(session))
}

// Task module: ADMIN + OPS can manage all tasks
export function canManageAllTasks(session: Session | null): boolean {
  return ['ADMIN', 'OPS'].includes(getRole(session))
}

// Any logged-in user can manage their own tasks
export function canManageOwnTask(
  session: Session | null,
  task: { assigneeId: string | null; creatorId: string },
): boolean {
  if (!session?.user?.id) return false
  return task.assigneeId === session.user.id || task.creatorId === session.user.id
}

// VIEW role gets no write access
export function isViewOnly(session: Session | null): boolean {
  return getRole(session) === 'VIEW'
}

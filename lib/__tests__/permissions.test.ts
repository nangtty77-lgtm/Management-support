import { describe, it, expect } from 'vitest'
import { canManageHR, canManageContracts, canManageAllTasks, canManageOwnTask, isViewOnly } from '../permissions'
import type { Session } from 'next-auth'

function makeSession(role: string, id = 'user-1'): Session {
  return { user: { id, name: 'Test', email: 'test@test.com', role }, expires: '' } as Session
}

describe('canManageHR', () => {
  it('allows ADMIN', () => expect(canManageHR(makeSession('ADMIN'))).toBe(true))
  it('allows HR', () => expect(canManageHR(makeSession('HR'))).toBe(true))
  it('denies OPS', () => expect(canManageHR(makeSession('OPS'))).toBe(false))
  it('denies VIEW', () => expect(canManageHR(makeSession('VIEW'))).toBe(false))
  it('denies null session', () => expect(canManageHR(null)).toBe(false))
})

describe('canManageContracts', () => {
  it('allows ADMIN', () => expect(canManageContracts(makeSession('ADMIN'))).toBe(true))
  it('allows GENERAL', () => expect(canManageContracts(makeSession('GENERAL'))).toBe(true))
  it('denies HR', () => expect(canManageContracts(makeSession('HR'))).toBe(false))
})

describe('canManageOwnTask', () => {
  const task = { assigneeId: 'user-1', creatorId: 'user-2' }
  it('allows assignee', () => expect(canManageOwnTask(makeSession('VIEW', 'user-1'), task)).toBe(true))
  it('allows creator', () => expect(canManageOwnTask(makeSession('VIEW', 'user-2'), task)).toBe(true))
  it('denies unrelated', () => expect(canManageOwnTask(makeSession('VIEW', 'user-3'), task)).toBe(false))
})

describe('isViewOnly', () => {
  it('returns true for VIEW', () => expect(isViewOnly(makeSession('VIEW'))).toBe(true))
  it('returns false for OPS', () => expect(isViewOnly(makeSession('OPS'))).toBe(false))
})

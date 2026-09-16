import { describe, it, expect } from 'vitest'
import { db } from '../db'

describe('db singleton', () => {
  it('exports a PrismaClient instance', () => {
    expect(db).toBeDefined()
    expect(typeof db.$connect).toBe('function')
  })
})

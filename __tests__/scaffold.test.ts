import { describe, it, expect } from 'vitest'

describe('BizHub scaffold', () => {
  it('test environment is configured', () => {
    expect(true).toBe(true)
  })

  it('jsdom is available', () => {
    expect(typeof document).toBe('object')
  })

  it('package name is bizhub', async () => {
    const pkg = await import('../package.json')
    expect(pkg.name).toBe('bizhub')
  })
})

/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react'
import { Badge } from '../Badge'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>활성</Badge>)
    expect(screen.getByText('활성')).toBeInTheDocument()
  })

  it('applies danger variant class', () => {
    render(<Badge variant="danger">위험</Badge>)
    const el = screen.getByText('위험')
    expect(el.className).toContain('text-danger')
  })
})

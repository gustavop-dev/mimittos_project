import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

jest.mock('@/lib/services/http', () => ({
  api: { get: jest.fn().mockResolvedValue({ data: [] }) },
}))

import HomePage from '../page'

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders hero heading', () => {
    render(<HomePage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toBeInTheDocument()
    expect(h1).toHaveTextContent(/recuerdo/i)
  })

  it('renders explore catalog link pointing to /catalog', () => {
    render(<HomePage />)
    const link = screen.getByRole('link', { name: /Explorar catálogo/i })
    expect(link).toHaveAttribute('href', '/catalog')
  })

  it('renders design your peluche link pointing to /products/1', () => {
    render(<HomePage />)
    const links = screen.getAllByRole('link', { name: /Diseña tu peluche/i })
    expect(links[0]).toHaveAttribute('href', '/products/1')
  })

  it('shows first FAQ answer open by default', () => {
    render(<HomePage />)
    expect(screen.getByText(/4 a 6 días hábiles/i)).toBeInTheDocument()
  })

  it('renders all FAQ questions', () => {
    render(<HomePage />)
    expect(screen.getByText(/Cuánto tarda en llegar mi peluche/i)).toBeInTheDocument()
    expect(screen.getByText(/abono y el contraentrega/i)).toBeInTheDocument()
    expect(screen.getByText(/materiales son los peluches/i)).toBeInTheDocument()
  })

  it('hides first FAQ answer after clicking its container', () => {
    render(<HomePage />)
    const firstAnswer = screen.getByText(/4 a 6 días hábiles/i)
    fireEvent.click(firstAnswer.parentElement!)
    expect(screen.queryByText(/4 a 6 días hábiles/i)).not.toBeInTheDocument()
  })
})

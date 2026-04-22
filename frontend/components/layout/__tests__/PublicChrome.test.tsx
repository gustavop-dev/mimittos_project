import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

jest.mock('@/lib/hooks/usePageView', () => ({
  usePageView: jest.fn(),
}))

jest.mock('../Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}))

jest.mock('../Footer', () => ({
  __esModule: true,
  default: () => <div data-testid="footer">Footer</div>,
}))

import { usePathname } from 'next/navigation'
import PublicChrome from '../PublicChrome'

const mockUsePathname = usePathname as unknown as jest.Mock

describe('PublicChrome', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders Header and Footer on a public route', () => {
    mockUsePathname.mockReturnValue('/catalog')
    render(<PublicChrome><div>content</div></PublicChrome>)
    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('renders only children on /backoffice routes', () => {
    mockUsePathname.mockReturnValue('/backoffice/pedidos')
    render(<PublicChrome><div>admin content</div></PublicChrome>)
    expect(screen.queryByTestId('header')).not.toBeInTheDocument()
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument()
    expect(screen.getByText('admin content')).toBeInTheDocument()
  })

  it('renders only children on /cart checkout flow route', () => {
    mockUsePathname.mockReturnValue('/cart')
    render(<PublicChrome><div>cart content</div></PublicChrome>)
    expect(screen.queryByTestId('header')).not.toBeInTheDocument()
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument()
  })

  it('renders only children on /checkout flow route', () => {
    mockUsePathname.mockReturnValue('/checkout')
    render(<PublicChrome><div>checkout content</div></PublicChrome>)
    expect(screen.queryByTestId('header')).not.toBeInTheDocument()
  })
})

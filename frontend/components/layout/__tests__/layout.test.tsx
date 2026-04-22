import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Footer from '../Footer'
import Header from '../Header'

import { useAuthStore } from '../../../lib/stores/authStore'
import { useCartStore } from '../../../lib/stores/cartStore'

jest.mock('../../../lib/stores/authStore', () => ({
  useAuthStore: jest.fn(),
}))

jest.mock('../../../lib/stores/cartStore', () => ({
  useCartStore: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}))

const mockUseAuthStore = useAuthStore as unknown as jest.Mock
const mockUseCartStore = useCartStore as unknown as jest.Mock

const renderHeader = (authState: { isAuthenticated: boolean; signOut: jest.Mock }, cartItems: Array<{ quantity: number }>) => {
  mockUseAuthStore.mockImplementation((selector: (state: typeof authState) => unknown) => selector(authState))
  mockUseCartStore.mockImplementation((selector: (state: { items: Array<{ quantity: number }> }) => unknown) =>
    selector({ items: cartItems })
  )
  return render(<Header />)
}

describe('layout components', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders footer brand', () => {
    render(<Footer />)
    expect(screen.getByText(/2026 MIMITTOS/i)).toBeInTheDocument()
  })

  it('renders header nav link to catalog', () => {
    renderHeader({ isAuthenticated: false, signOut: jest.fn() }, [])
    expect(screen.getByRole('link', { name: 'Catálogo' })).toHaveAttribute('href', '/catalog')
  })

  it('renders header sign-in link for unauthenticated users', () => {
    renderHeader({ isAuthenticated: false, signOut: jest.fn() }, [])
    expect(screen.getByRole('link', { name: 'Ingresar' })).toHaveAttribute('href', '/sign-in')
  })

  it('renders cart count badge when items exist', () => {
    renderHeader({ isAuthenticated: false, signOut: jest.fn() }, [{ quantity: 2 }, { quantity: 3 }])
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders orders link for authenticated users', () => {
    renderHeader({ isAuthenticated: true, signOut: jest.fn() }, [])
    expect(screen.getByRole('link', { name: 'Mis pedidos' })).toHaveAttribute('href', '/orders')
  })

  it('does not render Ingresar link for authenticated users', () => {
    renderHeader({ isAuthenticated: true, signOut: jest.fn() }, [])
    expect(screen.queryByRole('link', { name: 'Ingresar' })).not.toBeInTheDocument()
  })

  it('does not render Salir button for unauthenticated users', () => {
    renderHeader({ isAuthenticated: false, signOut: jest.fn() }, [])
    expect(screen.queryByRole('button', { name: 'Salir' })).not.toBeInTheDocument()
  })
})

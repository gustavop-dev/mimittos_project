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

  it('renders orders link and sign-out button for authenticated users', () => {
    renderHeader({ isAuthenticated: true, signOut: jest.fn() }, [])
    expect(screen.getByRole('link', { name: 'Mis pedidos' })).toHaveAttribute('href', '/orders')
    expect(screen.getByRole('button', { name: 'Salir' })).toBeInTheDocument()
  })

  it('calls signOut when Salir button is clicked', async () => {
    const signOut = jest.fn()
    renderHeader({ isAuthenticated: true, signOut }, [])
    await userEvent.click(screen.getByRole('button', { name: 'Salir' }))
    expect(signOut).toHaveBeenCalledTimes(1)
  })

  it('does not render Salir button for unauthenticated users', () => {
    renderHeader({ isAuthenticated: false, signOut: jest.fn() }, [])
    expect(screen.queryByRole('button', { name: 'Salir' })).not.toBeInTheDocument()
  })
})

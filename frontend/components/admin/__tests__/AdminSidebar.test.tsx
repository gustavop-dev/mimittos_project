import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

jest.mock('@/lib/stores/authStore', () => ({
  useAuthStore: jest.fn(),
}))

import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { AdminSidebar } from '../AdminSidebar'

const mockUsePathname = usePathname as unknown as jest.Mock
const mockUseAuthStore = useAuthStore as unknown as jest.Mock

const renderSidebar = (pathname: string, signOut = jest.fn()) => {
  mockUsePathname.mockReturnValue(pathname)
  mockUseAuthStore.mockImplementation((selector: (s: { signOut: typeof signOut }) => unknown) =>
    selector({ signOut })
  )
  return render(<AdminSidebar />)
}

describe('AdminSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all admin navigation links', () => {
    renderSidebar('/backoffice')
    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Pedidos/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Peluches/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Categorías/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Usuarios/i })).toBeInTheDocument()
  })

  it('renders "Ver tienda" link pointing to the store root', () => {
    renderSidebar('/backoffice')
    const storeLink = screen.getByRole('link', { name: /Ver tienda/i })
    expect(storeLink).toHaveAttribute('href', '/')
  })

  it('calls signOut when Cerrar sesión button is clicked', async () => {
    const signOut = jest.fn()
    renderSidebar('/backoffice', signOut)
    await userEvent.click(screen.getByRole('button', { name: /Cerrar sesión/i }))
    expect(signOut).toHaveBeenCalledTimes(1)
  })

  it('renders Panel Admin branding text', () => {
    renderSidebar('/backoffice')
    expect(screen.getByText('Panel Admin')).toBeInTheDocument()
  })
})

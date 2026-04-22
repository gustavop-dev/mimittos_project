import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'

jest.mock('@/lib/services/userAdminService', () => ({
  userAdminService: {
    list: jest.fn(),
    update: jest.fn(),
  },
}))

import { userAdminService } from '@/lib/services/userAdminService'
import UsuariosAdminPage from '../page'

const mockList = userAdminService.list as jest.Mock

describe('UsuariosAdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockList.mockResolvedValue([])
  })

  it('renders the Usuarios h1 heading', () => {
    render(<UsuariosAdminPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Usuarios' })).toBeInTheDocument()
  })

  it('renders user count text after data loads', async () => {
    render(<UsuariosAdminPage />)
    await waitFor(() => {
      expect(screen.getByText(/0 usuario\(s\)/i)).toBeInTheDocument()
    })
  })
})

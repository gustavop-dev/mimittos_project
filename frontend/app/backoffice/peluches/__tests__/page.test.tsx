import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'

jest.mock('@/lib/services/peluchService', () => ({
  peluchService: {
    listPeluches: jest.fn(),
    getCategories: jest.fn(),
  },
}))

jest.mock('@/lib/services/peluchAdminService', () => ({
  peluchAdminService: {
    delete: jest.fn(),
    bulkUpdateCategory: jest.fn(),
  },
}))

import { peluchService } from '@/lib/services/peluchService'
import PeluchesAdminPage from '../page'

const mockListPeluches = peluchService.listPeluches as jest.Mock
const mockGetCategories = peluchService.getCategories as jest.Mock

describe('PeluchesAdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockListPeluches.mockResolvedValue([])
    mockGetCategories.mockResolvedValue([])
  })

  it('renders the Peluches h1 heading', () => {
    render(<PeluchesAdminPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Peluches' })).toBeInTheDocument()
  })

  it('renders the new peluche link after data loads', async () => {
    render(<PeluchesAdminPage />)
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Nuevo peluche/i })).toHaveAttribute('href', '/backoffice/peluches/nuevo')
    })
  })
})

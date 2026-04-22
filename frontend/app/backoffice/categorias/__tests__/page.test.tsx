import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'

jest.mock('@/lib/services/peluchService', () => ({
  peluchService: { getCategories: jest.fn() },
}))

jest.mock('@/lib/services/categoryAdminService', () => ({
  categoryAdminService: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}))

import { peluchService } from '@/lib/services/peluchService'
import CategoriasPage from '../page'

const mockGetCategories = peluchService.getCategories as jest.Mock

describe('CategoriasPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetCategories.mockResolvedValue([])
  })

  it('renders the Categorías h1 heading', () => {
    render(<CategoriasPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Categorías' })).toBeInTheDocument()
  })

  it('renders the create category button after data loads', async () => {
    render(<CategoriasPage />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nueva categoría/i })).toBeInTheDocument()
    })
  })
})

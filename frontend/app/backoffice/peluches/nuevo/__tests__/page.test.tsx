import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

jest.mock('@/components/admin/PeluchForm', () => ({
  PeluchForm: ({ existing }: { existing?: unknown }) => (
    <div data-testid="peluch-form" data-mode={existing ? 'edit' : 'create'} />
  ),
}))

import NuevoPeluchPage from '../page'

describe('NuevoPeluchPage', () => {
  it('renders the page heading', () => {
    render(<NuevoPeluchPage />)
    expect(screen.getByRole('heading', { name: /Nuevo peluche/i })).toBeInTheDocument()
  })

  it('renders back link to /backoffice/peluches', () => {
    render(<NuevoPeluchPage />)
    const link = screen.getByRole('link', { name: /Volver a peluches/i })
    expect(link).toHaveAttribute('href', '/backoffice/peluches')
  })

  it('renders PeluchForm in create mode (no existing prop)', () => {
    render(<NuevoPeluchPage />)
    const form = screen.getByTestId('peluch-form')
    expect(form).toBeInTheDocument()
    expect(form).toHaveAttribute('data-mode', 'create')
  })
})

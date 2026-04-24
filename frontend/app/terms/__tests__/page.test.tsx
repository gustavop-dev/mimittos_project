import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import TermsPage from '../page'

describe('TermsPage', () => {
  it('renders the Términos y Condiciones h1 heading', () => {
    render(<TermsPage />)
    expect(screen.getByRole('heading', { level: 1, name: /Términos y Condiciones/i })).toBeInTheDocument()
  })

  it('renders a contact page link at the bottom', () => {
    render(<TermsPage />)
    expect(screen.getByRole('link', { name: /Contáctanos/i })).toHaveAttribute('href', '/contact')
  })
})

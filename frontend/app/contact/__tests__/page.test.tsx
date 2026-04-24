import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import ContactPage from '../page'

describe('ContactPage', () => {
  it('renders the contact page heading', () => {
    render(<ContactPage />)
    expect(screen.getByText(/Estamos aquí para ti/i)).toBeInTheDocument()
  })

  it('renders a link to the catalog for navigation', () => {
    render(<ContactPage />)
    const faqLink = screen.getByRole('link', { name: /Ver preguntas frecuentes/i })
    expect(faqLink).toHaveAttribute('href', '/#faq')
  })
})

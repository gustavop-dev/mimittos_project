import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import AboutPage from '../page'

describe('AboutPage', () => {
  it('renders the page badge for our story', () => {
    render(<AboutPage />)
    expect(screen.getByText(/Nuestra historia/i)).toBeInTheDocument()
  })

  it('renders a link to the catalog', () => {
    render(<AboutPage />)
    expect(screen.getByRole('link', { name: /Ver catálogo/i })).toHaveAttribute('href', '/catalog')
  })
})

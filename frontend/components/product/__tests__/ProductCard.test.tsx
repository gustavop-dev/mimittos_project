import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import ProductCard from '../ProductCard'
import { mockPeluches } from '../../../lib/__tests__/fixtures'

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill: _fill, ...otherProps } = props
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...otherProps} />
  },
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

describe('ProductCard', () => {
  const peluch = mockPeluches[0]

  it('should render peluch title', () => {
    render(<ProductCard product={peluch} />)
    expect(screen.getByText(peluch.title)).toBeInTheDocument()
  })

  it('should render peluch price formatted', () => {
    render(<ProductCard product={peluch} />)
    expect(screen.getByText(/85\.000/)).toBeInTheDocument()
  })

  it('should render peluch category', () => {
    render(<ProductCard product={peluch} />)
    expect(screen.getByText(peluch.category_name)).toBeInTheDocument()
  })

  it('should render peluch image when gallery_urls has items', () => {
    render(<ProductCard product={peluch} />)
    const image = screen.getByAltText(peluch.title)
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', peluch.gallery_urls[0])
  })

  it('should not render image when gallery_urls is empty', () => {
    const peluchWithoutImage = { ...peluch, gallery_urls: [] }
    render(<ProductCard product={peluchWithoutImage} />)
    expect(screen.queryByAltText(peluch.title)).not.toBeInTheDocument()
  })

  it('should link to peluches detail page', () => {
    render(<ProductCard product={peluch} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', `/peluches/${peluch.slug}`)
  })

  it('should show null price placeholder when min_price is null', () => {
    const peluchNoPrice = { ...peluch, min_price: null }
    render(<ProductCard product={peluchNoPrice} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})

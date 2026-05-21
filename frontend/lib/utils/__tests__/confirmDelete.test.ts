import {
  isConfirmationValid,
  buildColorImpact,
  buildSizeImpact,
  confirmDangerousDelete,
} from '../confirmDelete'
import Swal from 'sweetalert2'

jest.mock('sweetalert2', () => ({
  __esModule: true,
  default: { fire: jest.fn() },
}))

const mockFire = Swal.fire as jest.Mock

describe('isConfirmationValid', () => {
  it('returns true when the input matches the name exactly', () => {
    expect(isConfirmationValid('Rubí rojo', 'Rubí rojo')).toBe(true)
  })

  it('returns true ignoring surrounding whitespace', () => {
    expect(isConfirmationValid('  Rubí rojo  ', 'Rubí rojo')).toBe(true)
  })

  it('returns false when the input does not match', () => {
    expect(isConfirmationValid('rubi rojo', 'Rubí rojo')).toBe(false)
  })
})

describe('buildColorImpact', () => {
  it('lists products, photos and orders when all are non-zero', () => {
    expect(buildColorImpact({ products: 5, photos: 12, orders: 3 })).toEqual([
      'Se quitará de 5 producto(s)',
      'Se borrarán 12 foto(s) de color',
      '3 pedido(s) conservarán el nombre como texto',
    ])
  })

  it('omits lines whose count is zero', () => {
    expect(buildColorImpact({ products: 0, photos: 0, orders: 0 })).toEqual([])
  })
})

describe('buildSizeImpact', () => {
  it('lists products and orders when non-zero', () => {
    expect(buildSizeImpact({ products: 4, orders: 2 })).toEqual([
      'Se quitará de 4 producto(s)',
      '2 pedido(s) conservarán la talla como texto',
    ])
  })
})

describe('confirmDangerousDelete', () => {
  beforeEach(() => mockFire.mockReset())

  it('returns true when the dialog is confirmed', async () => {
    mockFire.mockResolvedValue({ isConfirmed: true })
    const result = await confirmDangerousDelete({ entity: 'color', name: 'Rubí rojo', impact: [] })
    expect(result).toBe(true)
  })

  it('returns false when the dialog is dismissed', async () => {
    mockFire.mockResolvedValue({ isConfirmed: false })
    const result = await confirmDangerousDelete({ entity: 'color', name: 'Rubí rojo', impact: [] })
    expect(result).toBe(false)
  })

  it('passes a text input and the item name in the title', async () => {
    mockFire.mockResolvedValue({ isConfirmed: false })
    await confirmDangerousDelete({ entity: 'talla', name: 'Mediano', impact: [] })
    const config = mockFire.mock.calls[0][0]
    expect(config.input).toBe('text')
    expect(config.title).toContain('Mediano')
  })
})

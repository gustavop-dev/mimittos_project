import {
  isConfirmationValid,
  buildColorImpact,
  buildSizeImpact,
  confirmDangerousDelete,
  notifyDeleteError,
} from '../confirmDelete'
import Swal from 'sweetalert2'

jest.mock('sweetalert2', () => ({
  __esModule: true,
  default: {
    fire: jest.fn(),
    getConfirmButton: jest.fn(),
    getInput: jest.fn(),
    showValidationMessage: jest.fn(),
  },
}))

const mockFire = Swal.fire as jest.Mock
const mockGetConfirmButton = Swal.getConfirmButton as jest.Mock
const mockGetInput = Swal.getInput as jest.Mock
const mockShowValidationMessage = Swal.showValidationMessage as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

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

  it('renders the impact bullets in the dialog html', async () => {
    mockFire.mockResolvedValue({ isConfirmed: false })
    await confirmDangerousDelete({
      entity: 'color',
      name: 'Rubí rojo',
      impact: ['Se quitará de 5 producto(s)', 'Se borrarán 12 foto(s) de color'],
    })
    const config = mockFire.mock.calls[0][0]
    expect(config.html).toContain('Se quitará de 5 producto(s)')
    expect(config.html).toContain('Se borrarán 12 foto(s) de color')
  })
})

describe('confirmDangerousDelete — didOpen gate', () => {
  it('disables the confirm button until the exact name is typed', async () => {
    const confirmButton = document.createElement('button')
    const input = document.createElement('input')
    mockGetConfirmButton.mockReturnValue(confirmButton)
    mockGetInput.mockReturnValue(input)
    mockFire.mockResolvedValue({ isConfirmed: false })

    await confirmDangerousDelete({ entity: 'color', name: 'Rubí rojo', impact: [] })
    const config = mockFire.mock.calls[0][0]
    config.didOpen()

    expect(confirmButton.disabled).toBe(true)

    input.value = 'Rubí rojo'
    input.dispatchEvent(new Event('input'))
    expect(confirmButton.disabled).toBe(false)

    input.value = 'incorrecto'
    input.dispatchEvent(new Event('input'))
    expect(confirmButton.disabled).toBe(true)
  })

  it('does nothing when the confirm button is not available', async () => {
    mockGetConfirmButton.mockReturnValue(null)
    mockGetInput.mockReturnValue(document.createElement('input'))
    mockFire.mockResolvedValue({ isConfirmed: false })

    await confirmDangerousDelete({ entity: 'color', name: 'Rubí rojo', impact: [] })
    const config = mockFire.mock.calls[0][0]

    expect(() => config.didOpen()).not.toThrow()
  })
})

describe('confirmDangerousDelete — preConfirm gate', () => {
  it('returns true for the exact name', async () => {
    mockFire.mockResolvedValue({ isConfirmed: false })
    await confirmDangerousDelete({ entity: 'color', name: 'Rubí rojo', impact: [] })
    const config = mockFire.mock.calls[0][0]
    expect(config.preConfirm('Rubí rojo')).toBe(true)
  })

  it('returns false and shows a validation message for a wrong name', async () => {
    mockFire.mockResolvedValue({ isConfirmed: false })
    await confirmDangerousDelete({ entity: 'color', name: 'Rubí rojo', impact: [] })
    const config = mockFire.mock.calls[0][0]
    expect(config.preConfirm('incorrecto')).toBe(false)
    expect(mockShowValidationMessage).toHaveBeenCalled()
  })
})

describe('notifyDeleteError', () => {
  it('opens an error dialog with the given message', () => {
    mockFire.mockResolvedValue({})
    notifyDeleteError('No se pudo eliminar el color.')
    const config = mockFire.mock.calls[0][0]
    expect(config.icon).toBe('error')
    expect(config.text).toBe('No se pudo eliminar el color.')
  })
})

import { afterEach, describe, it, expect, beforeEach } from '@jest/globals'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import CatalogPage from '../page'
import { peluchService } from '../../../lib/services/peluchService'
import type { Category, GlobalSize } from '../../../lib/types'

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('../../../lib/services/peluchService', () => ({
  peluchService: {
    listPeluches: jest.fn(),
    getCategories: jest.fn(),
    getSizes: jest.fn(),
  },
}))

const mockPeluchService = peluchService as jest.Mocked<typeof peluchService>

const mockPeluches = [
  {
    id: 1, title: 'Osito Coral', slug: 'osito-coral',
    category_name: 'Ositos', category_slug: 'ositos',
    lead_description: '', badge: 'bestseller' as const,
    is_active: true, is_featured: true, discount_pct: 0, display_order: 100,
    min_price: 85000, discounted_min_price: 85000,
    available_colors: [], gallery_urls: [],
    average_rating: 4.9, review_count: 10,
    has_huella: true, has_corazon: true, has_audio: false,
    deposit_percentage: 50, full_payment_discount_pct: 0, free_shipping: false, shipping_cost: 0,
  },
  {
    id: 2, title: 'Conejito Lucía', slug: 'conejito-lucia',
    category_name: 'Conejitos', category_slug: 'conejitos',
    lead_description: '', badge: 'new' as const,
    is_active: true, is_featured: false, discount_pct: 0, display_order: 100,
    min_price: 95000, discounted_min_price: 95000,
    available_colors: [], gallery_urls: [],
    average_rating: 4.7, review_count: 5,
    has_huella: false, has_corazon: true, has_audio: false,
    deposit_percentage: 50, full_payment_discount_pct: 0, free_shipping: false, shipping_cost: 0,
  },
]

const createPeluch = (id: number) => ({
  ...mockPeluches[0],
  id,
  title: `Peluche ${id}`,
  slug: `peluche-${id}`,
})

const manyPeluches = (count: number) => Array.from({ length: count }, (_, i) => createPeluch(i + 1))

const catalogCategory: Category = {
  id: 1,
  name: 'Ositos',
  slug: 'ositos',
  description: 'Peluches de oso',
  display_order: 1,
  is_active: true,
  is_featured: false,
  image_url: null,
}

const catalogSize: GlobalSize = {
  id: 1,
  label: 'Pequeño',
  slug: 'pequeno',
  cm: '20cm',
  sort_order: 1,
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })
  return { promise, resolve, reject }
}

function changePriceRepeatedly(slider: HTMLElement, count: number) {
  Array.from({ length: count }, (_, index) => {
    fireEvent.change(slider, { target: { value: String(100000 - ((count - index - 1) % 2) * 10000) } })
  })
}

async function advancePriceDebounce() {
  await act(async () => {
    jest.advanceTimersByTime(300)
    await Promise.resolve()
  })
}

async function flushAsyncState() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

type CatalogListParams = NonNullable<Parameters<typeof peluchService.listPeluches>[0]>

const immediateFilterCases: Array<{
  name: string
  prepare: () => unknown
  trigger: () => Promise<void>
  params: CatalogListParams
}> = [
  {
    name: 'category',
    prepare: () => mockPeluchService.getCategories.mockResolvedValue([catalogCategory]),
    trigger: async () => {
      fireEvent.click(await screen.findByText('Ositos'))
    },
    params: { category: 'ositos', size: undefined, max_price: 100000, has_huella: undefined, sort: 'popular' },
  },
  {
    name: 'size',
    prepare: () => mockPeluchService.getSizes.mockResolvedValue([catalogSize]),
    trigger: async () => {
      fireEvent.click(await screen.findByText('Pequeño · 20cm'))
    },
    params: { category: undefined, size: 'pequeno', max_price: 100000, has_huella: undefined, sort: 'popular' },
  },
  {
    name: 'huella',
    prepare: () => undefined,
    trigger: async () => {
      fireEvent.click(screen.getByText('Solo con huella 🐾'))
    },
    params: { category: undefined, size: undefined, max_price: 100000, has_huella: true, sort: 'popular' },
  },
  {
    name: 'order',
    prepare: () => undefined,
    trigger: async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'price_asc' } })
    },
    params: { category: undefined, size: undefined, max_price: 100000, has_huella: undefined, sort: 'price_asc' },
  },
]

function mockDesktopViewport() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: jest.fn().mockReturnValue({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }),
  })
}

describe('CatalogPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    delete (window as any).matchMedia
    window.scrollTo = jest.fn()
    mockPeluchService.getCategories.mockResolvedValue([])
    mockPeluchService.getSizes.mockResolvedValue([])
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders catalog heading', () => {
    mockPeluchService.listPeluches.mockResolvedValue([])
    render(<CatalogPage />)
    expect(screen.getByRole('heading', { name: /Descubre el peluche/i })).toBeInTheDocument()
  })

  it('shows loading state before fetch resolves', () => {
    mockPeluchService.listPeluches.mockReturnValue(new Promise(() => {}))
    render(<CatalogPage />)
    expect(screen.getByText('Cargando peluches...')).toBeInTheDocument()
  })

  it('calls listPeluches on mount', async () => {
    mockPeluchService.listPeluches.mockResolvedValue([])
    render(<CatalogPage />)
    await waitFor(() => {
      expect(mockPeluchService.listPeluches).toHaveBeenCalledTimes(1)
    })
  })

  it('renders empty state when no peluches match', async () => {
    mockPeluchService.listPeluches.mockResolvedValue([])
    render(<CatalogPage />)
    await waitFor(() => {
      expect(screen.getByText('Sin peluches en esta búsqueda')).toBeInTheDocument()
    })
  })

  it('renders peluch cards when data is available', async () => {
    mockPeluchService.listPeluches.mockResolvedValue(mockPeluches)
    render(<CatalogPage />)
    await waitFor(() => {
      expect(screen.getByText('Osito Coral')).toBeInTheDocument()
      expect(screen.getByText('Conejito Lucía')).toBeInTheDocument()
    })
  })

  it('hides pagination when results fit on one page', async () => {
    mockPeluchService.listPeluches.mockResolvedValue(manyPeluches(12))
    render(<CatalogPage />)
    await waitFor(() => {
      expect(screen.getByText('Peluche 12')).toBeInTheDocument()
    })
    expect(screen.queryByRole('navigation', { name: /paginación/i })).not.toBeInTheDocument()
  })

  it('shows pagination controls when results exceed the mobile page size', async () => {
    mockPeluchService.listPeluches.mockResolvedValue(manyPeluches(13))
    render(<CatalogPage />)
    await waitFor(() => {
      expect(screen.getByRole('navigation', { name: /paginación/i })).toBeInTheDocument()
    })
  })

  it('renders only 12 cards on the first mobile page', async () => {
    mockPeluchService.listPeluches.mockResolvedValue(manyPeluches(13))
    render(<CatalogPage />)
    await waitFor(() => {
      expect(screen.getByText('Peluche 12')).toBeInTheDocument()
    })
    expect(screen.queryByText('Peluche 13')).not.toBeInTheDocument()
  })

  it('shows the remaining cards after navigating to the next page', async () => {
    const user = userEvent.setup()
    mockPeluchService.listPeluches.mockResolvedValue(manyPeluches(13))
    render(<CatalogPage />)
    await waitFor(() => {
      expect(screen.getByText('Peluche 12')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /página siguiente/i }))

    expect(screen.getByText('Peluche 13')).toBeInTheDocument()
    expect(screen.queryByText('Peluche 1', { exact: true })).not.toBeInTheDocument()
    // Fails if local pagination starts a network request for an already loaded catalog.
    expect(mockPeluchService.listPeluches).toHaveBeenCalledTimes(1)
  })

  it('renders 16 cards on the first desktop page', async () => {
    mockDesktopViewport()
    mockPeluchService.listPeluches.mockResolvedValue(manyPeluches(17))
    render(<CatalogPage />)
    await waitFor(() => {
      expect(screen.getByText('Peluche 16')).toBeInTheDocument()
    })
    expect(screen.queryByText('Peluche 17')).not.toBeInTheDocument()
  })

  it.each([1, 50])('debounces %s price changes into the final catalog request', async (eventCount) => {
    jest.useFakeTimers()
    mockPeluchService.listPeluches.mockResolvedValue([])
    render(<CatalogPage />)

    await flushAsyncState()
    expect(mockPeluchService.listPeluches).toHaveBeenCalledTimes(1)
    const slider = screen.getByRole('slider', { name: 'Precio máximo' })

    changePriceRepeatedly(slider, eventCount)

    expect((slider as HTMLInputElement).value).toBe('100000')
    expect(screen.getByText('$100.000')).toBeInTheDocument()
    expect(mockPeluchService.listPeluches).toHaveBeenCalledTimes(1)

    await advancePriceDebounce()

    // Fails if every range event restores one catalog request.
    expect(mockPeluchService.listPeluches).toHaveBeenCalledTimes(2)
    expect(mockPeluchService.listPeluches).toHaveBeenLastCalledWith(
      { category: undefined, size: undefined, max_price: 100000, has_huella: undefined, sort: 'popular' },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  }, 15000)

  it.each(immediateFilterCases)('loads $name immediately with the pending price', async ({ prepare, trigger, params }) => {
    jest.useFakeTimers()
    prepare()
    mockPeluchService.listPeluches.mockResolvedValue([])
    render(<CatalogPage />)

    await flushAsyncState()
    expect(mockPeluchService.listPeluches).toHaveBeenCalledTimes(1)
    const slider = screen.getByRole('slider', { name: 'Precio máximo' })
    fireEvent.change(slider, { target: { value: '100000' } })
    await trigger()

    // Fails if another filter loses the pending price or leaves its stale timer queued.
    expect(mockPeluchService.listPeluches).toHaveBeenCalledTimes(2)
    expect(mockPeluchService.listPeluches).toHaveBeenLastCalledWith(
      params,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
    await advancePriceDebounce()
    expect(mockPeluchService.listPeluches).toHaveBeenCalledTimes(2)
  })

  it('ignores obsolete responses while a price request is pending', async () => {
    jest.useFakeTimers()
    const oldRequest = deferred<typeof mockPeluches>()
    const newRequest = deferred<typeof mockPeluches>()
    mockPeluchService.listPeluches
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(newRequest.promise)
    render(<CatalogPage />)

    const slider = screen.getByRole('slider', { name: 'Precio máximo' })
    fireEvent.change(slider, { target: { value: '100000' } })
    await act(async () => {
      oldRequest.resolve([{ ...mockPeluches[0], title: 'Resultado antiguo' }])
      await Promise.resolve()
    })

    // Fails if a transport that ignores abort publishes an old generation during debounce.
    expect(screen.getByText('Cargando peluches...')).toBeInTheDocument()
    expect(screen.queryByText('Resultado antiguo')).not.toBeInTheDocument()

    await advancePriceDebounce()
    await act(async () => {
      newRequest.resolve([{ ...mockPeluches[1], title: 'Resultado nuevo' }])
      await Promise.resolve()
    })

    expect(screen.getByText('Resultado nuevo')).toBeInTheDocument()
    expect(screen.queryByText('Resultado antiguo')).not.toBeInTheDocument()
  })

  it('keeps the newest response when an older request resolves after it', async () => {
    const oldRequest = deferred<typeof mockPeluches>()
    const newRequest = deferred<typeof mockPeluches>()
    mockPeluchService.listPeluches
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(newRequest.promise)
    render(<CatalogPage />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'price_asc' } })
    await act(async () => {
      newRequest.resolve([{ ...mockPeluches[1], title: 'Resultado nuevo' }])
      await Promise.resolve()
    })
    await act(async () => {
      oldRequest.resolve([{ ...mockPeluches[0], title: 'Resultado antiguo' }])
      await Promise.resolve()
    })

    // Fails if a late first response overwrites a newer filter result.
    expect(screen.getByText('Resultado nuevo')).toBeInTheDocument()
    expect(screen.queryByText('Resultado antiguo')).not.toBeInTheDocument()
  })

  it('does not start a price request after unmounting during debounce', async () => {
    jest.useFakeTimers()
    mockPeluchService.listPeluches.mockResolvedValue([])
    const { unmount } = render(<CatalogPage />)

    await flushAsyncState()
    expect(mockPeluchService.listPeluches).toHaveBeenCalledTimes(1)
    fireEvent.change(screen.getByRole('slider', { name: 'Precio máximo' }), { target: { value: '100000' } })
    unmount()
    await advancePriceDebounce()

    // Fails if cleanup leaves a timer that fetches after the catalog disappears.
    expect(mockPeluchService.listPeluches).toHaveBeenCalledTimes(1)
  })

  it('aborts the active request when the catalog unmounts', async () => {
    const activeRequest = deferred<typeof mockPeluches>()
    mockPeluchService.listPeluches.mockReturnValue(activeRequest.promise)
    const { unmount } = render(<CatalogPage />)

    await waitFor(() => expect(mockPeluchService.listPeluches).toHaveBeenCalledTimes(1))
    const [, options] = mockPeluchService.listPeluches.mock.calls[0]
    unmount()

    // Fails if unmount leaves an in-flight catalog request alive.
    expect(options?.signal?.aborted).toBe(true)
  })

  it('omits max_price after returning the slider to its ceiling', async () => {
    jest.useFakeTimers()
    mockPeluchService.listPeluches.mockResolvedValue([])
    render(<CatalogPage />)

    await flushAsyncState()
    expect(mockPeluchService.listPeluches).toHaveBeenCalledTimes(1)
    const slider = screen.getByRole('slider', { name: 'Precio máximo' })
    fireEvent.change(slider, { target: { value: '100000' } })
    fireEvent.change(slider, { target: { value: '250000' } })
    await advancePriceDebounce()

    // Fails if the default maximum leaks into the catalog query and fragments caches.
    expect(mockPeluchService.listPeluches).toHaveBeenLastCalledWith(
      { category: undefined, size: undefined, max_price: undefined, has_huella: undefined, sort: 'popular' },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
    expect(mockPeluchService.listPeluches).toHaveBeenCalledTimes(2)
  })

  it('returns to the first page after applying a catalog order', async () => {
    mockPeluchService.listPeluches.mockResolvedValue(manyPeluches(13))
    render(<CatalogPage />)

    await screen.findByText('Peluche 12')
    fireEvent.click(screen.getByRole('button', { name: /página siguiente/i }))
    expect(screen.getByText('Peluche 13')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'price_asc' } })

    // Fails if filtering keeps page two and leaves the refreshed catalog on the wrong slice.
    await screen.findByText('Peluche 1', { exact: true })
    expect(screen.queryByText('Peluche 13')).not.toBeInTheDocument()
  })

  it('preserves the previous catalog results when the current request fails', async () => {
    mockPeluchService.listPeluches
      .mockResolvedValueOnce(mockPeluches)
      .mockRejectedValueOnce(new Error('Network error'))
    render(<CatalogPage />)

    await screen.findByText('Osito Coral')
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'price_asc' } })

    // Fails if a current request error clears successful results or leaves loading indefinitely.
    await waitFor(() => expect(screen.queryByText('Cargando peluches...')).not.toBeInTheDocument())
    expect(screen.getByText('Osito Coral')).toBeInTheDocument()
  })
})

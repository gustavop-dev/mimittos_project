import { describe, it, expect, beforeEach } from '@jest/globals'
import { renderHook, act } from '@testing-library/react'
import { useCartStore, lineTotal, calcDeposit } from '../cartStore'
import { mockCartItems } from '../../__tests__/fixtures'

const item1 = mockCartItems[0] // peluch_id:1 size_id:2 color_id:1, unit_price:128000, qty:2
const item2 = mockCartItems[1] // peluch_id:2 size_id:1 color_id:2, unit_price:92000, qty:1

describe('cartStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useCartStore())
    act(() => { result.current.clearCart() })
  })

  describe('addToCart', () => {
    it('should add a new item to cart', () => {
      const { result } = renderHook(() => useCartStore())
      act(() => { result.current.addToCart({ ...item1, quantity: 1 }) })
      expect(result.current.items).toHaveLength(1)
    })

    it('should increase quantity when same peluch+size+color added again', () => {
      const { result } = renderHook(() => useCartStore())
      act(() => {
        result.current.addToCart({ ...item1, quantity: 2 })
        result.current.addToCart({ ...item1, quantity: 3 })
      })
      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].quantity).toBe(5)
    })

    it('should add multiple different items', () => {
      const { result } = renderHook(() => useCartStore())
      act(() => {
        result.current.addToCart({ ...item1, quantity: 1 })
        result.current.addToCart({ ...item2, quantity: 1 })
      })
      expect(result.current.items).toHaveLength(2)
    })

    it('should treat same peluch with different size as separate item', () => {
      const { result } = renderHook(() => useCartStore())
      act(() => {
        result.current.addToCart({ ...item1, quantity: 1 })
        result.current.addToCart({ ...item1, size_id: 99, quantity: 1 })
      })
      expect(result.current.items).toHaveLength(2)
    })
  })

  describe('removeFromCart', () => {
    it('should remove the specified item', () => {
      const { result } = renderHook(() => useCartStore())
      act(() => {
        result.current.addToCart({ ...item1, quantity: 1 })
        result.current.removeFromCart(item1.peluch_id, item1.size_id, item1.color_id)
      })
      expect(result.current.items).toHaveLength(0)
    })

    it('should only remove the specified item and keep others', () => {
      const { result } = renderHook(() => useCartStore())
      act(() => {
        result.current.addToCart({ ...item1, quantity: 1 })
        result.current.addToCart({ ...item2, quantity: 1 })
        result.current.removeFromCart(item1.peluch_id, item1.size_id, item1.color_id)
      })
      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].peluch_id).toBe(item2.peluch_id)
    })
  })

  describe('updateQuantity', () => {
    it('should update the quantity of an item', () => {
      const { result } = renderHook(() => useCartStore())
      act(() => {
        result.current.addToCart({ ...item1, quantity: 1 })
        result.current.updateQuantity(item1.peluch_id, item1.size_id, item1.color_id, 5)
      })
      expect(result.current.items[0].quantity).toBe(5)
    })

    it('should remove item when quantity is set to 0', () => {
      const { result } = renderHook(() => useCartStore())
      act(() => {
        result.current.addToCart({ ...item1, quantity: 1 })
        result.current.updateQuantity(item1.peluch_id, item1.size_id, item1.color_id, 0)
      })
      expect(result.current.items).toHaveLength(0)
    })
  })

  describe('clearCart', () => {
    it('should remove all items', () => {
      const { result } = renderHook(() => useCartStore())
      act(() => {
        result.current.addToCart({ ...item1, quantity: 1 })
        result.current.addToCart({ ...item2, quantity: 1 })
        result.current.clearCart()
      })
      expect(result.current.items).toHaveLength(0)
    })
  })

  describe('subtotal', () => {
    it('should calculate correct subtotal using lineTotal', () => {
      const { result } = renderHook(() => useCartStore())
      act(() => {
        result.current.addToCart({ ...item1, quantity: 2 }) // 128000 * 2
        result.current.addToCart({ ...item2, quantity: 1 }) // 92000 * 1
      })
      expect(result.current.subtotal()).toBe(128000 * 2 + 92000 * 1)
    })

    it('should return 0 for empty cart', () => {
      const { result } = renderHook(() => useCartStore())
      expect(result.current.subtotal()).toBe(0)
    })
  })
})

describe('lineTotal', () => {
  it('should compute (unit_price + personalization_cost) * quantity', () => {
    const item = { ...item1, unit_price: 100000, personalization_cost: 20000, quantity: 3 }
    expect(lineTotal(item)).toBe(360000)
  })
})

describe('calcDeposit', () => {
  it('should round to nearest 100 COP', () => {
    expect(calcDeposit(100000)).toBe(50000)
    expect(calcDeposit(85000)).toBe(42500)
  })
})

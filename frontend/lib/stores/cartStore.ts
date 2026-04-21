'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { CartItem } from '@/lib/types'

function cartKey(item: CartItem) {
  return `${item.peluch_id}-${item.size_id}-${item.color_id}`
}

export function lineTotal(item: CartItem) {
  return ((item.unit_price ?? 0) + (item.personalization_cost ?? 0)) * (item.quantity ?? 1)
}

export function calcDeposit(subtotal: number) {
  return Math.round((subtotal * 0.5) / 100) * 100
}

type CartState = {
  items: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (peluch_id: number, size_id: number, color_id: number) => void
  clearCart: () => void
  updateQuantity: (peluch_id: number, size_id: number, color_id: number, quantity: number) => void
  subtotal: () => number
  deposit: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (item) => {
        set((state) => {
          const key = cartKey(item)
          const existing = state.items.find((i) => cartKey(i) === key)
          if (existing) {
            return {
              items: state.items.map((i) =>
                cartKey(i) === key ? { ...i, quantity: i.quantity + item.quantity } : i
              ),
            }
          }
          return { items: [...state.items, item] }
        })
      },

      removeFromCart: (peluch_id, size_id, color_id) => {
        const key = `${peluch_id}-${size_id}-${color_id}`
        set((state) => ({ items: state.items.filter((i) => cartKey(i) !== key) }))
      },

      clearCart: () => set({ items: [] }),

      updateQuantity: (peluch_id, size_id, color_id, quantity) => {
        const key = `${peluch_id}-${size_id}-${color_id}`
        set((state) => ({
          items: state.items
            .map((i) => (cartKey(i) === key ? { ...i, quantity } : i))
            .filter((i) => i.quantity > 0),
        }))
      },

      subtotal: () => get().items.reduce((acc, item) => acc + lineTotal(item), 0),

      deposit: () => calcDeposit(get().subtotal()),
    }),
    {
      name: 'cart',
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        state.items = state.items.filter(
          (item) =>
            typeof item.peluch_id === 'number' && item.peluch_id > 0 &&
            typeof item.size_id === 'number' && item.size_id > 0 &&
            typeof item.color_id === 'number' && item.color_id > 0
        )
      },
    }
  )
)

'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/services/http'

export const BANNER_HEIGHT = 40

interface BannerData {
  is_active: boolean
  message: string
  bg_color?: string
  text_color?: string
}

interface Props {
  onLoad: (active: boolean) => void
}

export default function PromoBanner({ onLoad }: Props) {
  const [data, setData] = useState<BannerData | null>(null)

  useEffect(() => {
    api.get('/content/promo_banner/')
      .then((r) => {
        const d = r.data?.content_json as BannerData
        if (d?.is_active && d?.message) {
          setData(d)
          onLoad(true)
        } else {
          onLoad(false)
        }
      })
      .catch(() => onLoad(false))
  }, [])

  if (!data?.is_active || !data?.message) return null

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 51,
        height: BANNER_HEIGHT,
        background: data.bg_color || 'var(--coral)',
        color: data.text_color || '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Quicksand', sans-serif", fontWeight: 700,
        fontSize: 13, letterSpacing: '.03em', padding: '0 16px',
        textAlign: 'center',
      }}
    >
      {data.message}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'

import { api } from '@/lib/services/http'
import type { Peluch } from '@/lib/types'

export function useFirstFeaturedHref(): string {
  const [href, setHref] = useState('/catalog')

  useEffect(() => {
    api
      .get<Peluch[]>('/peluches/featured/')
      .then((r) => {
        const slug = r.data?.[0]?.slug
        if (slug) setHref(`/peluches/${slug}`)
      })
      .catch(() => {})
  }, [])

  return href
}

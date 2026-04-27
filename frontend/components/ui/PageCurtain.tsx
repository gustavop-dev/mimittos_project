'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import gsap from 'gsap'

export function PageCurtain() {
  const curtainRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const isFirst = useRef(true)

  useEffect(() => {
    const el = curtainRef.current
    if (!el) return

    if (isFirst.current) {
      isFirst.current = false
      // Initial load: curtain slides up to reveal the page
      gsap.fromTo(
        el,
        { yPercent: 0 },
        { yPercent: -100, duration: 1.1, ease: 'power3.inOut', delay: 0.05 }
      )
    } else {
      // Route change: instantly cover screen, then slide away
      const tl = gsap.timeline()
      tl.set(el, { yPercent: 0 })
        .to(el, { yPercent: -100, duration: 0.75, ease: 'power3.inOut', delay: 0.04 })
    }
  }, [pathname])

  return (
    <div
      ref={curtainRef}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--coral)',
        pointerEvents: 'none',
        willChange: 'transform',
      }}
    />
  )
}

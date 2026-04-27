'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import gsap from 'gsap'

export function PageCurtain() {
  const curtainRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const isFirst = useRef(true)

  useEffect(() => {
    const el = curtainRef.current
    const txt = textRef.current
    if (!el) return

    if (isFirst.current) {
      isFirst.current = false
      // Fade text in then slide the whole curtain up
      if (txt) {
        gsap.fromTo(txt,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', delay: 0.1 }
        )
      }
      gsap.fromTo(
        el,
        { yPercent: 0 },
        { yPercent: -100, duration: 1.15, ease: 'power3.inOut', delay: 0.55 }
      )
    } else {
      const tl = gsap.timeline()
      tl.set(el, { yPercent: 0 })
      if (txt) tl.set(txt, { opacity: 0, y: 18 })
      if (txt) tl.to(txt, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' })
      tl.to(el, { yPercent: -100, duration: 0.75, ease: 'power3.inOut', delay: 0.1 }, '-=0.1')
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div ref={textRef} style={{ textAlign: 'center', color: '#fff', opacity: 0 }}>
        {/* Desktop: una línea */}
        <div
          className="hidden sm:block"
          style={{
            fontFamily: "'Quicksand', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(48px, 8vw, 96px)',
            letterSpacing: '.18em',
            lineHeight: 1,
          }}
        >
          MIMITTOS<sup style={{ fontSize: '0.38em', verticalAlign: 'super', letterSpacing: 0 }}>®</sup>
        </div>

        {/* Mobile: dos líneas */}
        <div
          className="block sm:hidden"
          style={{
            fontFamily: "'Quicksand', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(52px, 18vw, 80px)',
            letterSpacing: '.18em',
            lineHeight: 1.05,
          }}
        >
          <div>MIMI</div>
          <div>TTOS<sup style={{ fontSize: '0.38em', verticalAlign: 'super', letterSpacing: 0 }}>®</sup></div>
        </div>
      </div>
    </div>
  )
}

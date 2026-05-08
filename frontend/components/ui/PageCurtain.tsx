'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

export function PageCurtain() {
  const curtainRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const [hide, setHide] = useState(false)

  useEffect(() => {
    const el = curtainRef.current
    if (!el) return

    if (textRef.current) {
      gsap.fromTo(
        textRef.current,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', delay: 0.1 }
      )
    }
    gsap.fromTo(
      el,
      { yPercent: 0 },
      {
        yPercent: -100,
        duration: 1.15,
        ease: 'power3.inOut',
        delay: 0.55,
        onComplete: () => setHide(true),
      }
    )

    // Safety net: if GSAP somehow stalls, hide the curtain after 3s no matter what.
    const fallback = window.setTimeout(() => setHide(true), 3000)
    return () => window.clearTimeout(fallback)
  }, [])

  if (hide) return null

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
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div ref={textRef} style={{ textAlign: 'center', color: '#fff', opacity: 0, padding: '0 16px' }}>
        <div
          style={{
            fontFamily: "'Quicksand', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(36px, 10vw, 96px)',
            letterSpacing: '.18em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          MIMITTOS<sup style={{ fontSize: '0.38em', verticalAlign: 'super', letterSpacing: 0 }}>®</sup>
        </div>
      </div>
    </div>
  )
}

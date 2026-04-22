'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

import { useAuthStore } from '@/lib/stores/authStore'
import { useCartStore } from '@/lib/stores/cartStore'

export default function Header() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const signOut = useAuthStore((s) => s.signOut)
  const cartCount = useCartStore((s) => s.items.reduce((acc, item) => acc + item.quantity, 0))
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const navLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/catalog', label: 'Catálogo' },
    { href: '/about', label: 'Historia' },
    { href: '/contact', label: 'Contacto' },
  ]

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(255,249,246,.9)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      borderBottom: '1px solid rgba(212,132,138,.12)',
    }}>
      <div style={{
        maxWidth: 1360, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 40px',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/mimittos/logo-dark-small.png" alt="MIMITTOS" width={48} height={48}
            style={{ borderRadius: '50%', boxShadow: 'var(--shadow-sm)' }} />
          <span style={{
            fontFamily: "'Quicksand', sans-serif", fontWeight: 700,
            fontSize: 22, letterSpacing: '.24em', color: 'var(--coral)',
          }}>MIMITTOS</span>
        </Link>

        <nav style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} style={{
              fontWeight: 600, fontSize: 15,
              color: pathname === href ? 'var(--coral)' : 'var(--navy)',
              transition: 'color .2s',
            }}>
              {label}
            </Link>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/cart" style={{ ...iconBtnStyle, position: 'relative' } as React.CSSProperties} aria-label="Carrito">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                minWidth: 18, height: 18, borderRadius: '50%',
                background: 'var(--coral)', color: '#fff',
                fontSize: 10, fontWeight: 700,
                display: 'grid', placeItems: 'center', padding: '0 5px',
              }}>{cartCount}</span>
            )}
          </Link>

          {mounted && (isAuthenticated ? (
            <Link href="/orders" style={loginBtnStyle}>Mis pedidos</Link>
          ) : (
            <Link href="/sign-in" style={loginBtnStyle}>Ingresar</Link>
          ))}
        </div>
      </div>
    </header>
  )
}

const iconBtnStyle: React.CSSProperties = {
  width: 42, height: 42, borderRadius: '50%',
  display: 'grid', placeItems: 'center',
  color: 'var(--navy)', background: 'transparent',
  transition: 'background .2s, color .2s',
}

const loginBtnStyle: React.CSSProperties = {
  background: 'var(--coral)', color: '#fff',
  padding: '10px 20px', borderRadius: 999,
  fontWeight: 600, fontSize: 14,
  boxShadow: '0 6px 16px rgba(212,132,138,.28)',
  transition: 'transform .2s, box-shadow .2s',
}

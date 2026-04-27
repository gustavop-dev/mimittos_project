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
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => setMounted(true), [])

  // Close menu on route change
  useEffect(() => setMenuOpen(false), [pathname])

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
      <div className="mx-auto flex items-center justify-between px-4 sm:px-8 lg:px-10 py-3" style={{ maxWidth: 1360 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/mimittos/logo-dark-small.png" alt="MIMITTOS" width={48} height={48}
            style={{ borderRadius: '50%', boxShadow: 'var(--shadow-sm)' }} />
          <span style={{
            fontFamily: "'Quicksand', sans-serif", fontWeight: 700,
            fontSize: 22, letterSpacing: '.24em', color: 'var(--coral)',
          }}>MIMITTOS</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex" style={{ gap: 36, alignItems: 'center' }}>
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
            <Link href="/orders" className="hidden sm:inline-flex" style={loginBtnStyle}>Mis pedidos</Link>
          ) : (
            <Link href="/sign-in" className="hidden sm:inline-flex" style={loginBtnStyle}>Ingresar</Link>
          ))}

          {/* Hamburger button — mobile only */}
          <button
            className="flex md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menú"
            style={{ ...iconBtnStyle, flexDirection: 'column', gap: 5, padding: 10 }}
          >
            <span style={{
              display: 'block', width: 20, height: 2,
              background: 'var(--navy)', borderRadius: 2,
              transition: 'transform .2s, opacity .2s',
              transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none',
            }} />
            <span style={{
              display: 'block', width: 20, height: 2,
              background: 'var(--navy)', borderRadius: 2,
              opacity: menuOpen ? 0 : 1, transition: 'opacity .2s',
            }} />
            <span style={{
              display: 'block', width: 20, height: 2,
              background: 'var(--navy)', borderRadius: 2,
              transition: 'transform .2s, opacity .2s',
              transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
            }} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden" style={{
          background: 'rgba(255,249,246,.97)',
          borderTop: '1px solid rgba(212,132,138,.12)',
          padding: '16px 24px 24px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} style={{
              fontWeight: 600, fontSize: 16,
              color: pathname === href ? 'var(--coral)' : 'var(--navy)',
              padding: '12px 0',
              borderBottom: '1px solid rgba(212,132,138,.08)',
            }}>
              {label}
            </Link>
          ))}
          <div style={{ marginTop: 16 }}>
            {mounted && (isAuthenticated ? (
              <Link href="/orders" style={{ ...loginBtnStyle, display: 'inline-flex' }}>Mis pedidos</Link>
            ) : (
              <Link href="/sign-in" style={{ ...loginBtnStyle, display: 'inline-flex' }}>Ingresar</Link>
            ))}
          </div>
        </div>
      )}
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

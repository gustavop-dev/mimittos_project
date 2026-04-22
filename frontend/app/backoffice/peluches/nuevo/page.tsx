'use client'

import Link from 'next/link'
import { PeluchForm } from '@/components/admin/PeluchForm'

export default function NuevoPeluchPage() {
  return (
    <div style={{ padding: '30px 40px 60px' }}>
      <div style={{ marginBottom: 28 }}>
        <Link href="/backoffice/peluches" style={{ fontSize: 13, color: 'var(--coral)', textDecoration: 'none', fontWeight: 600 }}>
          ← Volver a peluches
        </Link>
        <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 28, color: 'var(--navy)', marginTop: 10, marginBottom: 4 }}>Nuevo peluche</h1>
        <p style={{ color: 'var(--gray-warm)', fontSize: 14 }}>Completa la información para agregar un modelo al catálogo</p>
      </div>
      <PeluchForm />
    </div>
  )
}

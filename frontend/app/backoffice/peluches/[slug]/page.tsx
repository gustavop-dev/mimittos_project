'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { use } from 'react'

import { peluchService } from '@/lib/services/peluchService'
import { PeluchForm } from '@/components/admin/PeluchForm'
import type { PeluchDetail } from '@/lib/types'

export default function EditarPeluchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [peluch, setPeluch] = useState<PeluchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    peluchService.getPeluchBySlug(slug)
      .then(setPeluch)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div style={{ padding: '40px' }}><p style={{ color: 'var(--gray-warm)' }}>Cargando...</p></div>
  if (notFound || !peluch) return <div style={{ padding: '40px' }}><p style={{ color: '#c23b3b' }}>Peluche no encontrado.</p></div>

  return (
    <div style={{ padding: '30px 40px 60px' }}>
      <div style={{ marginBottom: 28 }}>
        <Link href="/backoffice/peluches" style={{ fontSize: 13, color: 'var(--coral)', textDecoration: 'none', fontWeight: 600 }}>
          ← Volver a peluches
        </Link>
        <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 28, color: 'var(--navy)', marginTop: 10, marginBottom: 4 }}>Editar: {peluch.title}</h1>
        <p style={{ color: 'var(--gray-warm)', fontSize: 14 }}>Modifica los datos del peluche</p>
      </div>
      <PeluchForm existing={peluch} />
    </div>
  )
}

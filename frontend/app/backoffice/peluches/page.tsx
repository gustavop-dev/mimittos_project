'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { peluchAdminService } from '@/lib/services/peluchAdminService'
import { peluchService } from '@/lib/services/peluchService'
import type { Peluch, Category } from '@/lib/types'

const BADGE_LABELS: Record<string, string> = {
  none: '—', bestseller: 'Bestseller', new: 'Nuevo', limited_edition: 'Ed. limitada',
}

function fmt(n: number | null) {
  if (n == null) return '—'
  return '$' + n.toLocaleString('es-CO')
}

export default function PeluchesAdminPage() {
  const [peluches, setPeluches] = useState<Peluch[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkCategoryId, setBulkCategoryId] = useState('')
  const [bulkSaving, setBulkSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      peluchService.listPeluches(),
      peluchService.getCategories(),
    ]).then(([p, c]) => {
      setPeluches(p)
      setCategories(c)
    }).finally(() => setLoading(false))
  }, [])

  async function handleDelete(slug: string) {
    try {
      await peluchAdminService.delete(slug)
      setPeluches((prev) => prev.filter((p) => p.slug !== slug))
      setSelected((prev) => { const n = new Set(prev); n.delete(slug); return n })
    } catch {
      alert('No se pudo eliminar el peluche.')
    }
    setDeleteConfirm(null)
  }

  async function toggleFeatured(peluch: Peluch) {
    const newVal = !peluch.is_featured
    if (newVal) {
      const count = peluches.filter((p) => p.is_featured).length
      if (count >= 4) {
        alert('Ya hay 4 peluches destacados. Quita uno antes de destacar otro.')
        return
      }
    }
    setPeluches((prev) => prev.map((p) => p.slug === peluch.slug ? { ...p, is_featured: newVal } : p))
    try {
      await peluchAdminService.update(peluch.slug, { is_featured: newVal })
    } catch (err: unknown) {
      setPeluches((prev) => prev.map((p) => p.slug === peluch.slug ? { ...p, is_featured: peluch.is_featured } : p))
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      alert(msg || 'No se pudo actualizar el estado destacado.')
    }
  }

  function toggleSelect(slug: string) {
    setSelected((prev) => {
      const n = new Set(prev)
      n.has(slug) ? n.delete(slug) : n.add(slug)
      return n
    })
  }

  function toggleAll() {
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((p) => p.slug)))
    }
  }

  async function handleBulkCategory() {
    if (!bulkCategoryId || selected.size === 0) return
    setBulkSaving(true)
    try {
      await peluchAdminService.bulkUpdateCategory([...selected], Number(bulkCategoryId))
      const cat = categories.find((c) => c.id === Number(bulkCategoryId))
      if (cat) {
        setPeluches((prev) => prev.map((p) =>
          selected.has(p.slug) ? { ...p, category_name: cat.name, category_slug: cat.slug } : p
        ))
      }
      setSelected(new Set())
      setBulkCategoryId('')
    } catch {
      alert('No se pudo actualizar la categoría.')
    } finally {
      setBulkSaving(false)
    }
  }

  const filtered = peluches.filter((p) => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCat || p.category_slug === filterCat
    return matchSearch && matchCat
  })

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.slug))

  return (
    <div style={{ padding: '30px 40px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 28, color: 'var(--navy)', marginBottom: 4 }}>Peluches</h1>
          <p style={{ color: 'var(--gray-warm)', fontSize: 14 }}>Catálogo completo de modelos</p>
        </div>
        <Link href="/backoffice/peluches/nuevo" style={btnPrimary}>+ Nuevo peluche</Link>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre..."
          style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid rgba(27,42,74,.1)', fontSize: 13, fontFamily: 'inherit', background: '#fff', width: 240 }}
        />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid rgba(27,42,74,.1)', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      </div>

      {/* Barra de acciones masivas */}
      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '12px 18px', background: 'rgba(212,132,138,.08)', borderRadius: 12, border: '1.5px solid rgba(212,132,138,.25)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>
            {selected.size} seleccionado{selected.size !== 1 ? 's' : ''}
          </span>
          <span style={{ color: 'rgba(27,42,74,.2)' }}>|</span>
          <select
            value={bulkCategoryId}
            onChange={(e) => setBulkCategoryId(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid rgba(27,42,74,.1)', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}
          >
            <option value="">Asignar categoría...</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button
            onClick={handleBulkCategory}
            disabled={!bulkCategoryId || bulkSaving}
            style={{ padding: '7px 16px', background: 'var(--coral)', color: '#fff', border: 'none', borderRadius: 8, cursor: bulkCategoryId ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', opacity: !bulkCategoryId || bulkSaving ? .5 : 1 }}
          >
            {bulkSaving ? 'Guardando...' : 'Asignar'}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            style={{ padding: '7px 14px', background: 'transparent', color: 'var(--gray-warm)', border: '1px solid rgba(27,42,74,.1)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}
          >
            Deseleccionar todo
          </button>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--gray-warm)' }}>Cargando...</p>
      ) : (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--cream-warm)', borderBottom: '1px dashed rgba(212,132,138,.2)' }}>
                <th style={{ ...thStyle, width: 40 }}>
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                {['Peluche', 'Categoría', 'Precio desde', 'Descuento', 'Badge', 'Destacado', 'Acciones'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.slug} style={{ borderBottom: '1px dashed rgba(212,132,138,.12)', background: selected.has(p.slug) ? 'rgba(212,132,138,.04)' : undefined }}>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selected.has(p.slug)}
                      onChange={() => toggleSelect(p.slug)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-warm)' }}>{p.slug}</div>
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--gray-warm)' }}>{p.category_name}</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--terracotta)' }}>
                    {p.discount_pct > 0 ? (
                      <div>
                        <div>{fmt(p.discounted_min_price)}</div>
                        <div style={{ textDecoration: 'line-through', fontSize: 11, color: 'var(--gray-warm)', fontWeight: 400 }}>{fmt(p.min_price)}</div>
                      </div>
                    ) : fmt(p.min_price)}
                  </td>
                  <td style={tdStyle}>
                    {p.discount_pct > 0 ? (
                      <span style={{ background: '#FFEBEE', color: '#C62828', padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                        -{p.discount_pct}%
                      </span>
                    ) : '—'}
                  </td>
                  <td style={tdStyle}>
                    {p.badge !== 'none' && (
                      <span style={{ background: '#FFF3E0', color: '#E65100', padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                        {BADGE_LABELS[p.badge]}
                      </span>
                    )}
                    {p.badge === 'none' && '—'}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button
                      onClick={() => toggleFeatured(p)}
                      title={p.is_featured ? 'Quitar destacado' : 'Destacar'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}
                    >
                      {p.is_featured ? '⭐' : '☆'}
                    </button>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href={`/backoffice/peluches/${p.slug}`} style={btnEdit}>Editar</Link>
                      {deleteConfirm === p.slug ? (
                        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: '#c23b3b' }}>¿Confirmar?</span>
                          <button onClick={() => handleDelete(p.slug)} style={btnDanger}>Sí</button>
                          <button onClick={() => setDeleteConfirm(null)} style={btnEdit}>No</button>
                        </span>
                      ) : (
                        <button onClick={() => setDeleteConfirm(p.slug)} style={btnDanger}>Eliminar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && !loading && (
                <tr><td colSpan={9} style={{ padding: '40px 14px', textAlign: 'center', color: 'var(--gray-warm)' }}>Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = { padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--navy)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }
const tdStyle: React.CSSProperties = { padding: '10px 14px' }
const btnPrimary: React.CSSProperties = { padding: '10px 20px', background: 'var(--coral)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', textDecoration: 'none', display: 'inline-block' }
const btnEdit: React.CSSProperties = { padding: '6px 14px', background: 'var(--cream-warm)', color: 'var(--navy)', border: '1px solid rgba(27,42,74,.1)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', textDecoration: 'none', display: 'inline-block' }
const btnDanger: React.CSSProperties = { padding: '6px 14px', background: '#FFEBEE', color: '#C62828', border: '1px solid #FFCDD2', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }

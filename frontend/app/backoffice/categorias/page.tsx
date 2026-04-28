'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

import { peluchService } from '@/lib/services/peluchService'
import { categoryAdminService } from '@/lib/services/categoryAdminService'
import type { Category } from '@/lib/types'

const emptyForm = { name: '', description: '', display_order: 0, is_active: true, is_featured: false }

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; editing: Category | null }>({ open: false, editing: null })
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    setLoading(true)
    try {
      const data = await peluchService.getCategories()
      setCategories(data)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setForm(emptyForm)
    setImageFile(null)
    setImagePreview(null)
    setModal({ open: true, editing: null })
    setError('')
  }

  function openEdit(cat: Category) {
    setForm({ name: cat.name, description: cat.description, display_order: cat.display_order, is_active: cat.is_active, is_featured: cat.is_featured })
    setImageFile(null)
    setImagePreview(cat.image_url ?? null)
    setModal({ open: true, editing: cat })
    setError('')
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const featuredCount = categories.filter((c) => c.is_featured).length
  const canFeature = (cat?: Category) => {
    if (cat?.is_featured) return true
    return featuredCount < 4
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
    if (form.is_featured && !canFeature(modal.editing ?? undefined)) {
      setError('Ya hay 4 categorías destacadas. Quita una antes de destacar esta.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('description', form.description)
      fd.append('display_order', String(form.display_order))
      fd.append('is_active', String(form.is_active))
      fd.append('is_featured', String(form.is_featured))
      if (imageFile) fd.append('image', imageFile)

      if (modal.editing) {
        const updated = await categoryAdminService.update(modal.editing.id, fd)
        setCategories((prev) => prev.map((c) => c.id === modal.editing!.id ? updated : c))
      } else {
        const created = await categoryAdminService.create(fd)
        setCategories((prev) => [...prev, created])
      }
      setModal({ open: false, editing: null })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'No se pudo guardar la categoría.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      await categoryAdminService.delete(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } catch {
      alert('No se pudo eliminar la categoría.')
    }
    setDeleteConfirm(null)
  }

  return (
    <div style={{ padding: '30px 40px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 28, color: 'var(--navy)', marginBottom: 4 }}>Categorías</h1>
          <p style={{ color: 'var(--gray-warm)', fontSize: 14 }}>
            Organización del catálogo de peluches ·{' '}
            <span style={{ color: featuredCount >= 4 ? '#c23b3b' : '#2E7D32', fontWeight: 600 }}>
              {featuredCount}/4 destacadas
            </span>
          </p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>+ Nueva categoría</button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--gray-warm)' }}>Cargando...</p>
      ) : (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--cream-warm)', borderBottom: '1px dashed rgba(212,132,138,.2)' }}>
                {['Imagen', 'Nombre', 'Slug', 'Descripción', 'Orden', 'Activa', 'Destacada', 'Acciones'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} style={{ borderBottom: '1px dashed rgba(212,132,138,.12)' }}>
                  <td style={tdStyle}>
                    {cat.image_url ? (
                      <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', position: 'relative', background: 'var(--cream-warm)' }}>
                        <Image src={cat.image_url} alt={cat.name} fill style={{ objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--cream-warm)', display: 'grid', placeItems: 'center', color: 'var(--gray-warm)', fontSize: 20 }}>🖼️</div>
                    )}
                  </td>
                  <td style={tdStyle}><span style={{ fontWeight: 600, color: 'var(--navy)' }}>{cat.name}</span></td>
                  <td style={tdStyle}><code style={{ fontSize: 11, background: 'var(--cream-warm)', padding: '2px 6px', borderRadius: 4 }}>{cat.slug}</code></td>
                  <td style={{ ...tdStyle, color: 'var(--gray-warm)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.description || '—'}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{cat.display_order}</td>
                  <td style={tdStyle}>
                    <span style={{ color: cat.is_active ? '#2E7D32' : '#C62828', fontWeight: 600 }}>
                      {cat.is_active ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={{ fontSize: 20 }} title={cat.is_featured ? 'Destacada' : 'No destacada'}>
                      {cat.is_featured ? '⭐' : '☆'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(cat)} style={btnEdit}>Editar</button>
                      {deleteConfirm === cat.id ? (
                        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: '#c23b3b' }}>¿Confirmar?</span>
                          <button onClick={() => handleDelete(cat.id)} style={btnDanger}>Sí</button>
                          <button onClick={() => setDeleteConfirm(null)} style={btnEdit}>No</button>
                        </span>
                      ) : (
                        <button onClick={() => setDeleteConfirm(cat.id)} style={btnDanger}>Eliminar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!categories.length && (
                <tr><td colSpan={8} style={{ padding: '40px 14px', textAlign: 'center', color: 'var(--gray-warm)' }}>Sin categorías</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div style={overlay} onClick={() => setModal({ open: false, editing: null })}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--navy)', marginBottom: 20 }}>
              {modal.editing ? 'Editar categoría' : 'Nueva categoría'}
            </h2>

            <label style={labelStyle}>Nombre *</label>
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="Ej: Osos de peluche" />

            <label style={labelStyle}>Descripción</label>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, height: 80, resize: 'vertical' }} placeholder="Descripción breve de la categoría..." />

            <label style={labelStyle}>Orden de visualización</label>
            <input type="number" value={form.display_order} onChange={(e) => setForm((p) => ({ ...p, display_order: Number(e.target.value) }))} style={inputStyle} min={0} />

            {/* Image upload */}
            <label style={labelStyle}>Foto de categoría</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 4 }}>
              {imagePreview && (
                <div style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                  <Image src={imagePreview} alt="preview" fill style={{ objectFit: 'cover' }} />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{ ...btnEdit, padding: '8px 14px' }}
              >
                {imagePreview ? 'Cambiar imagen' : 'Subir imagen'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--gray-warm)', marginTop: 2 }}>JPEG/PNG/WebP · máx. 5 MB</p>

            {/* Featured toggle */}
            <label style={{ ...labelStyle, marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => {
                  if (e.target.checked && !canFeature(modal.editing ?? undefined)) {
                    setError('Ya hay 4 categorías destacadas. Quita una antes de destacar esta.')
                    return
                  }
                  setError('')
                  setForm((p) => ({ ...p, is_featured: e.target.checked }))
                }}
              />
              Destacada en el Home
              <span style={{ fontSize: 11, color: featuredCount >= 4 ? '#c23b3b' : 'var(--gray-warm)', marginLeft: 4 }}>
                ({featuredCount}/4 usadas)
              </span>
            </label>
            {featuredCount >= 4 && !modal.editing?.is_featured && (
              <p style={{ fontSize: 12, color: '#c23b3b', marginTop: 4 }}>Límite alcanzado. Quita el destacado de otra categoría primero.</p>
            )}

            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
              Categoría activa (visible en tienda)
            </label>

            {error && <p style={{ color: '#c23b3b', fontSize: 13, marginTop: 10 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={handleSave} disabled={saving} style={btnPrimary}>{saving ? 'Guardando...' : 'Guardar'}</button>
              <button onClick={() => setModal({ open: false, editing: null })} style={btnEdit}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = { padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--navy)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }
const tdStyle: React.CSSProperties = { padding: '10px 14px' }
const btnPrimary: React.CSSProperties = { padding: '10px 20px', background: 'var(--coral)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }
const btnEdit: React.CSSProperties = { padding: '6px 14px', background: 'var(--cream-warm)', color: 'var(--navy)', border: '1px solid rgba(27,42,74,.1)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }
const btnDanger: React.CSSProperties = { padding: '6px 14px', background: '#FFEBEE', color: '#C62828', border: '1px solid #FFCDD2', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const modalBox: React.CSSProperties = { background: '#fff', borderRadius: 'var(--radius-lg)', padding: '32px', width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,.2)', maxHeight: '90vh', overflowY: 'auto' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6, marginTop: 14 }
const inputStyle: React.CSSProperties = { display: 'block', width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid rgba(27,42,74,.12)', fontSize: 14, fontFamily: 'inherit', color: 'var(--navy)', background: 'var(--cream-warm)', boxSizing: 'border-box' }

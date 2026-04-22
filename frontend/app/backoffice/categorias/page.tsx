'use client'

import { useEffect, useState } from 'react'

import { peluchService } from '@/lib/services/peluchService'
import { categoryAdminService } from '@/lib/services/categoryAdminService'
import type { Category } from '@/lib/types'

const emptyForm = { name: '', description: '', display_order: 0, is_active: true }

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; editing: Category | null }>({ open: false, editing: null })
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [error, setError] = useState('')

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
    setModal({ open: true, editing: null })
    setError('')
  }

  function openEdit(cat: Category) {
    setForm({ name: cat.name, description: cat.description, display_order: cat.display_order, is_active: cat.is_active })
    setModal({ open: true, editing: cat })
    setError('')
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    setError('')
    try {
      if (modal.editing) {
        const updated = await categoryAdminService.update(modal.editing.id, form)
        setCategories((prev) => prev.map((c) => c.id === modal.editing!.id ? updated : c))
      } else {
        const created = await categoryAdminService.create(form)
        setCategories((prev) => [...prev, created])
      }
      setModal({ open: false, editing: null })
    } catch {
      setError('No se pudo guardar la categoría.')
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
          <p style={{ color: 'var(--gray-warm)', fontSize: 14 }}>Organización del catálogo de peluches</p>
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
                {['Nombre', 'Slug', 'Descripción', 'Orden', 'Activa', 'Acciones'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} style={{ borderBottom: '1px dashed rgba(212,132,138,.12)' }}>
                  <td style={tdStyle}><span style={{ fontWeight: 600, color: 'var(--navy)' }}>{cat.name}</span></td>
                  <td style={tdStyle}><code style={{ fontSize: 11, background: 'var(--cream-warm)', padding: '2px 6px', borderRadius: 4 }}>{cat.slug}</code></td>
                  <td style={{ ...tdStyle, color: 'var(--gray-warm)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.description || '—'}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{cat.display_order}</td>
                  <td style={tdStyle}>
                    <span style={{ color: cat.is_active ? '#2E7D32' : '#C62828', fontWeight: 600 }}>
                      {cat.is_active ? 'Sí' : 'No'}
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
                <tr><td colSpan={6} style={{ padding: '40px 14px', textAlign: 'center', color: 'var(--gray-warm)' }}>Sin categorías</td></tr>
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
const modalBox: React.CSSProperties = { background: '#fff', borderRadius: 'var(--radius-lg)', padding: '32px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6, marginTop: 14 }
const inputStyle: React.CSSProperties = { display: 'block', width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid rgba(27,42,74,.12)', fontSize: 14, fontFamily: 'inherit', color: 'var(--navy)', background: 'var(--cream-warm)', boxSizing: 'border-box' }

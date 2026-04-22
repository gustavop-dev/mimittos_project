'use client'

import { useRequireAuth } from '@/lib/hooks/useRequireAuth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default function BackofficeLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useRequireAuth({ requireStaff: true })

  if (!isAuthenticated || !isAdmin) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream-warm)' }}>
      <AdminSidebar />
      <main style={{ flex: 1, overflow: 'auto', marginLeft: 220 }}>
        {children}
      </main>
    </div>
  )
}

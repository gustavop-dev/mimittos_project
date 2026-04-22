'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'
import { usePageView } from '@/lib/hooks/usePageView'

export default function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/backoffice')
  const isCheckoutFlow = ['/cart', '/checkout', '/payment', '/order-confirmed'].some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  usePageView()

  if (isAdmin || isCheckoutFlow) return <>{children}</>

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}

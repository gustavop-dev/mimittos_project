'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Header from './Header'
import Footer from './Footer'
import PromoBanner, { BANNER_HEIGHT } from './PromoBanner'
import { PageCurtain } from '@/components/ui/PageCurtain'
import { usePageView } from '@/lib/hooks/usePageView'

const HEADER_HEIGHT = 72

export default function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/backoffice')
  const isCheckoutFlow = ['/cart', '/checkout', '/payment', '/order-confirmed'].some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  const [bannerActive, setBannerActive] = useState(false)

  usePageView()

  if (isAdmin || isCheckoutFlow) return <>{children}</>

  const topOffset = HEADER_HEIGHT + (bannerActive ? BANNER_HEIGHT : 0)

  return (
    <>
      <PageCurtain />
      <PromoBanner onLoad={setBannerActive} />
      <Header bannerHeight={bannerActive ? BANNER_HEIGHT : 0} />
      <div style={{ paddingTop: topOffset }}>
        {children}
      </div>
      <Footer />
    </>
  )
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Catálogo de peluches personalizados — Diseña el tuyo',
  description:
    'Explora todos los modelos de peluches MIMITTOS: ositos, conejos, gatos, zorros y más. Personaliza tamaño, color, huella y audio. Producción artesanal en Colombia con envío a todo el país.',
  alternates: { canonical: '/catalog' },
  openGraph: {
    title: 'Catálogo MIMITTOS — Peluches artesanales personalizados',
    description:
      'Elige tu peluche, personaliza tamaño y color, agrégale huella o audio. Hecho a mano en Colombia.',
    url: 'https://mimittos.com/catalog',
    type: 'website',
  },
}

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return children
}

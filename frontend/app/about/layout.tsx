import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nuestra historia — 8 años creando abrazos a mano',
  description:
    'MIMITTOS nació en un pequeño taller en Colombia. Conoce a nuestro equipo de artesanos y los valores que guían cada peluche que cosemos a mano. Más de 2.400 peluches creados y 1.800 familias felices.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'Nuestra historia — MIMITTOS',
    description:
      'Más que peluches, guardianes de recuerdos. Conoce el taller artesanal detrás de cada MIMITTOS.',
    url: 'https://mimittos.com/about',
    type: 'article',
    images: [{ url: '/mimittos/team/rellenador.webp', width: 1200, height: 630, alt: 'Taller MIMITTOS' }],
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}

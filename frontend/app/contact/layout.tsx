import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Contacto — Estamos aquí para ti',
  description:
    'Habla con MIMITTOS por WhatsApp, correo electrónico o visita nuestro taller en Bogotá. Resolvemos cualquier duda sobre tu peluche personalizado en menos de 24 horas.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contacto MIMITTOS — Hablemos de tu peluche',
    description: 'WhatsApp · hola@mimittos.com · Calle 49 B Sur #5B-93, Bogotá.',
    url: 'https://mimittos.com/contact',
    type: 'website',
  },
}

const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'MIMITTOS',
  image: 'https://mimittos.com/mimittos/logo-dark-big.png',
  url: 'https://mimittos.com',
  telephone: '+57 3244790777',
  email: 'hola@mimittos.com',
  priceRange: '$$',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Calle 49 B Sur #5B-93',
    addressLocality: 'Bogotá',
    addressRegion: 'Cundinamarca',
    postalCode: '111811',
    addressCountry: 'CO',
  },
  openingHoursSpecification: [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '08:00',
    closes: '19:00',
  }],
  sameAs: ['https://wa.me/573244790777'],
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Script id="localbusiness-jsonld" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(localBusinessJsonLd)}
      </Script>
    </>
  )
}

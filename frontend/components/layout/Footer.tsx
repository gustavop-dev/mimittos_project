import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ background: 'var(--cream-peach)', marginTop: 0 }} className="pt-12 sm:pt-16 lg:pt-[70px] pb-8">
      <div className="mx-auto px-4 sm:px-8 lg:px-10" style={{ maxWidth: 1360 }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-[50px] mb-10 lg:mb-[50px]">
          <div>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <Image src="/mimittos/logo-dark-small.png" alt="MIMITTOS" width={40} height={40}
                style={{ borderRadius: '50%' }} />
              <span style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: '.24em', color: 'var(--coral)' }}>
                MIMITTOS
              </span>
            </Link>
            <p style={{ color: 'var(--gray-warm)', fontSize: 14, lineHeight: 1.6, maxWidth: 320, marginBottom: 20 }}>
              Más que un peluche, un recuerdo. Peluches artesanales hechos a mano en Colombia, pensados para quien los va a abrazar.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {SOCIAL_LINKS.map(({ label, href, path }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={socialBtnStyle}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h5 style={footerHeadStyle}>Explorar</h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['Inicio', '/'], ['Catálogo', '/catalog'], ['Historia', '/about'], ['Contacto', '/contact']].map(([label, href]) => (
                <li key={label}><Link href={href} style={{ color: 'var(--gray-warm)', fontSize: 14 }}>{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h5 style={footerHeadStyle}>Compañía</h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['Iniciar sesión', '/sign-in'], ['Regístrate', '/sign-up'], ['Términos y Condiciones', '/terms']].map(([label, href]) => (
                <li key={label}><Link href={href} style={{ color: 'var(--gray-warm)', fontSize: 14 }}>{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h5 style={footerHeadStyle}>Aquí para ti</h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><a href="https://wa.me/573244790777" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gray-warm)', fontSize: 14 }}>📱 WhatsApp: +57 3244790777</a></li>
              <li><a href="mailto:hola@mimittos.com" style={{ color: 'var(--gray-warm)', fontSize: 14 }}>✉️ hola@mimittos.com</a></li>
              <li><span style={{ color: 'var(--gray-warm)', fontSize: 14 }}>📍 Bogotá, Colombia</span></li>
            </ul>
            <h5 style={{ ...footerHeadStyle, marginTop: 22 }}>Pagamos con</h5>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 14 }}>
              {[
                { src: '/mimittos/payments/pse.png', alt: 'PSE' },
                { src: '/mimittos/payments/bancolombia.png', alt: 'Bancolombia' },
                { src: '/mimittos/payments/nequi.jpeg', alt: 'Nequi' },
                { src: '/mimittos/payments/card.svg', alt: 'Tarjeta crédito / débito' },
              ].map(({ src, alt }) => (
                <span key={alt} style={{ background: '#fff', padding: '6px 10px', borderRadius: 8, boxShadow: 'var(--shadow-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 44 }}>
                  <Image src={src} alt={alt} width={0} height={0} sizes="100vw" style={{ width: 'auto', height: 28, objectFit: 'contain', display: 'block' }} />
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(212,132,138,.2)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 13, color: 'var(--gray-warm)' }}>
          <div>© 2026 MIMITTOS · Más que un peluche, un recuerdo · Hecho con ♡ en Colombia</div>
          <div style={{ display: 'flex', gap: 18 }}>
            <Link href="/terms" style={{ color: 'var(--gray-warm)' }}>Términos y Condiciones</Link>
            <Link href="/terms" style={{ color: 'var(--gray-warm)' }}>Política de Privacidad</Link>
          </div>
        </div>
      </div>

      <a
        href="https://wa.me/573244790777"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contáctanos por WhatsApp"
        className="group"
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 50,
          width: 52, height: 52, borderRadius: '50%',
          background: '#22c55e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 15px 4px rgba(34,197,94,0.6)',
          transition: 'transform .2s ease',
          textDecoration: 'none',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true" width="26" height="26" focusable={false}
          style={{ fill: '#fff' }}>
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157m-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1s56.2 81.2 56.1 130.5c0 101.8-84.9 184.6-186.6 184.6m101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8s-14.3 18-17.6 21.8c-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7s-12.5-30.1-17.1-41.2c-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2s-9.7 1.4-14.8 6.9c-5.1 5.6-19.4 19-19.4 46.3s19.9 53.7 22.6 57.4c2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4s4.6-24.1 3.2-26.4c-1.3-2.5-5-3.9-10.5-6.6" />
        </svg>
        <span className="sr-only">Contáctanos por WhatsApp</span>
      </a>
    </footer>
  )
}

const footerHeadStyle: React.CSSProperties = {
  fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 15,
  color: 'var(--navy)', marginBottom: 18, letterSpacing: '.02em',
}

const socialBtnStyle: React.CSSProperties = {
  width: 40, height: 40, borderRadius: '50%',
  background: '#fff', color: 'var(--navy)',
  display: 'grid', placeItems: 'center',
  transition: 'background .2s, color .2s',
}

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/share/18WD9uuuG2/',
    path:
      'M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/peluches.mimittos?igsh=bHFjNHlzbmgzZGl5',
    path:
      'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@peluches.mimittos',
    path:
      'M19.589 6.686a4.793 4.793 0 01-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 01-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 013.183-4.51v-3.5a6.329 6.329 0 00-5.394 10.692 6.33 6.33 0 0010.857-4.424V8.687a8.182 8.182 0 004.773 1.526V6.79a4.831 4.831 0 01-1.003-.104z',
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/c/573244790777',
    path:
      'M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.738-.985zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z',
  },
]

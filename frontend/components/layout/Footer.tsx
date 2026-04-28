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
              {[
                { label: 'Instagram', path: 'M2 2h20v20a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V2zm0 0M16 11.4a4 4 0 1 1-7.9 1.1 4 4 0 0 1 7.9-1.1z' },
                { label: 'WhatsApp', path: 'M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z' },
                { label: 'TikTok', path: 'M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5' },
              ].map(({ label, path }) => (
                <a key={label} href="#" aria-label={label} style={socialBtnStyle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
              <li><a href="https://wa.me/573000000000" style={{ color: 'var(--gray-warm)', fontSize: 14 }}>📱 WhatsApp: +57 300 000 0000</a></li>
              <li><a href="mailto:hola@mimittos.co" style={{ color: 'var(--gray-warm)', fontSize: 14 }}>✉️ hola@mimittos.co</a></li>
              <li><span style={{ color: 'var(--gray-warm)', fontSize: 14 }}>📍 Medellín, Colombia</span></li>
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
        href="https://wa.me/573238122373"
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

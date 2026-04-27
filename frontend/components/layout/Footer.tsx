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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              {['PSE', 'Nequi', 'VISA', 'MasterCard'].map((m) => (
                <span key={m} style={{ background: '#fff', color: 'var(--navy)', fontSize: 11, fontWeight: 700, padding: '6px 10px', borderRadius: 8, boxShadow: 'var(--shadow-sm)' }}>{m}</span>
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

      <a href="https://wa.me/573000000000" aria-label="WhatsApp" style={{
        position: 'fixed', bottom: 28, right: 28, zIndex: 40,
        background: '#25D366', color: '#fff', height: 60, borderRadius: 30,
        padding: '0 22px 0 18px', display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 14px 36px rgba(37,211,102,.4)',
        fontWeight: 700, fontSize: 14, fontFamily: "'Quicksand', sans-serif",
        textDecoration: 'none',
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.3-.5.1-1.1.1-1.7-.1a12 12 0 0 1-4.1-2.4 8 8 0 0 1-2.3-3.2c-.2-.4-.6-1.2-.6-2 0-.8.4-1.2.6-1.4.2-.2.5-.3.7-.3h.4c.2 0 .3 0 .5.4l.8 1.8c.1.2 0 .4-.1.5l-.3.4a.5.5 0 0 0-.1.5c.1.2.5.9 1.1 1.5.7.7 1.4 1 1.6 1.1.2.1.4.1.5 0l.6-.7c.1-.2.4-.2.6-.1.2.1 1.4.7 1.6.8l.4.2c.1.1.1.4 0 .7z" />
        </svg>
        <span className="hidden sm:inline">Hablemos por WhatsApp</span>
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

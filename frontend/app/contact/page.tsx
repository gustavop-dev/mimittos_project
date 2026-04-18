import Link from 'next/link'

export default function ContactPage() {
  return (
    <main>
      {/* Breadcrumb */}
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '20px 40px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-warm)' }}>
        <Link href="/" style={{ color: 'var(--gray-warm)' }}>Inicio</Link>
        <span style={{ opacity: .5 }}>/</span>
        <b style={{ color: 'var(--navy)', fontWeight: 700 }}>Contacto</b>
      </div>

      {/* Page title */}
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '20px 40px 50px' }}>
        <div style={eyebrowStyle}>Estamos aquí para ti</div>
        <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 56, color: 'var(--navy)', letterSpacing: '-.02em', lineHeight: 1.08, maxWidth: 700 }}>
          Escríbenos — nos encanta escucharte.
        </h1>
        <p style={{ color: 'var(--gray-warm)', fontSize: 17, marginTop: 14, maxWidth: 580, lineHeight: 1.6 }}>
          ¿Tienes una pregunta, una idea especial o quieres saber más de tus peluches? Aquí estamos.
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px 80px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 60 }}>
        {/* Form */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 40, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 26, color: 'var(--navy)', marginBottom: 24 }}>Envíanos un mensaje</h2>
          <form style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={fieldLabelStyle}>Nombre completo</label>
                <input style={fieldInputStyle} placeholder="Tu nombre" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={fieldLabelStyle}>Correo electrónico</label>
                <input type="email" style={fieldInputStyle} placeholder="tu@correo.com" />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={fieldLabelStyle}>Asunto</label>
              <select style={fieldInputStyle}>
                <option>Consulta sobre un pedido</option>
                <option>Pedido especial / personalización</option>
                <option>Seguimiento de pedido</option>
                <option>Garantía o reparación</option>
                <option>Otro</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={fieldLabelStyle}>Mensaje</label>
              <textarea style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 120 }} placeholder="Cuéntanos en qué podemos ayudarte..." />
            </div>
            <button type="submit" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px 28px', borderRadius: 999, fontWeight: 700, fontSize: 15, background: 'var(--coral)', color: '#fff', boxShadow: '0 8px 22px rgba(212,132,138,.35)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Enviar mensaje
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </form>
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* WhatsApp */}
          <a href="https://wa.me/573000000000" style={{ background: '#25D366', borderRadius: 'var(--radius-lg)', padding: 28, display: 'flex', gap: 20, alignItems: 'center', color: '#fff', textDecoration: 'none', boxShadow: '0 10px 30px rgba(37,211,102,.3)' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z" /></svg>
            </div>
            <div>
              <strong style={{ display: 'block', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 20 }}>WhatsApp — respuesta rápida</strong>
              <span style={{ fontSize: 14, opacity: .9 }}>+57 300 000 0000 · Lunes a viernes 8am–7pm</span>
            </div>
          </a>

          {/* Email */}
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-sm)', display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--pink-melo)', color: 'var(--coral)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" /></svg>
            </div>
            <div>
              <strong style={{ display: 'block', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>Correo electrónico</strong>
              <a href="mailto:hola@mimittos.co" style={{ color: 'var(--coral)', fontSize: 14, fontWeight: 600 }}>hola@mimittos.co</a>
              <span style={{ display: 'block', fontSize: 13, color: 'var(--gray-warm)' }}>Respondemos en menos de 24 horas</span>
            </div>
          </div>

          {/* Location */}
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-sm)', display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--pink-melo)', color: 'var(--coral)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>
            </div>
            <div>
              <strong style={{ display: 'block', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>Nuestro taller</strong>
              <span style={{ fontSize: 14, color: 'var(--gray-warm)' }}>Medellín, Antioquia, Colombia</span>
              <span style={{ display: 'block', fontSize: 13, color: 'var(--gray-warm)' }}>Solo enviamos, no hay tienda física por ahora</span>
            </div>
          </div>

          {/* FAQ link */}
          <div style={{ background: 'linear-gradient(135deg,var(--cream-peach),var(--pink-melo))', borderRadius: 'var(--radius-lg)', padding: 28 }}>
            <strong style={{ display: 'block', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--navy)', marginBottom: 8 }}>¿Tienes una pregunta frecuente?</strong>
            <p style={{ fontSize: 14, color: 'var(--gray-warm)', lineHeight: 1.6, marginBottom: 14 }}>
              Puede que ya tengamos la respuesta en nuestra sección de preguntas frecuentes.
            </p>
            <Link href="/#faq" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 999, fontWeight: 600, fontSize: 14, background: 'var(--coral)', color: '#fff' }}>
              Ver preguntas frecuentes →
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

const eyebrowStyle: React.CSSProperties = {
  color: 'var(--coral)', fontFamily: "'Quicksand', sans-serif",
  fontWeight: 600, fontSize: 13, letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 8,
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: 'var(--navy)', letterSpacing: '.04em', textTransform: 'uppercase',
}

const fieldInputStyle: React.CSSProperties = {
  background: 'var(--cream-warm)', border: '1.5px solid rgba(27,42,74,.08)', borderRadius: 12,
  padding: '12px 14px', fontFamily: 'inherit', fontSize: 14, color: 'var(--navy)',
  outline: 'none', width: '100%',
}

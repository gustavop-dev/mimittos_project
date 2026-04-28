import Image from 'next/image'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <main>
      {/* Hero */}
      <section className="px-4 sm:px-8 py-16 md:py-[80px]" style={{ position: 'relative', background: 'linear-gradient(135deg,var(--cream-warm) 0%,var(--pink-melo) 60%,var(--coral-warm) 100%)', overflow: 'hidden', textAlign: 'center' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <span style={{ display: 'inline-block', padding: '8px 18px', background: 'rgba(255,255,255,.7)', backdropFilter: 'blur(8px)', borderRadius: 999, fontSize: 12, fontWeight: 700, color: 'var(--coral)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 22 }}>
            Nuestra historia
          </span>
          <h1 className="text-[42px] md:text-[72px]" style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, lineHeight: 1, color: 'var(--navy)', marginBottom: 18, letterSpacing: '-.02em' }}>
            Más que peluches,<br /><em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>guardianes</em> de recuerdos.
          </h1>
          <p style={{ fontSize: 19, color: 'var(--gray-warm)', lineHeight: 1.6, maxWidth: 680, margin: '0 auto' }}>
            MIMITTOS nació de la convicción de que cada peluche puede ser mucho más que un juguete — puede ser el guardián de un momento irrepetible.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto px-4 sm:px-8 py-16 md:py-[80px] grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-[60px] items-center" style={{ maxWidth: 1200 }}>
        <div style={{ aspectRatio: '4/5', borderRadius: 24, overflow: 'hidden', background: 'var(--pink-melo)', position: 'relative' }}>
          <Image src="https://images.unsplash.com/photo-1596463059283-da257325bab8?w=900&q=80" alt="Taller MIMITTOS" fill className="object-cover" />
        </div>
        <div>
          <h2 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 44, color: 'var(--navy)', marginBottom: 20, lineHeight: 1.1 }}>
            Por qué hacemos lo que <em style={{ color: 'var(--coral)', fontStyle: 'normal' }}>hacemos</em>
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--gray-warm)', marginBottom: 16 }}>
            Todo comenzó con una pregunta sencilla: ¿qué pasa si cada peluche lleva dentro el alma de un momento especial? Desde ese día, cada pieza que sale de nuestro taller carga con esa intención.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--gray-warm)', marginBottom: 16 }}>
            Trabajamos con artesanas locales en Medellín, usando telas premium y técnicas de bordado tradicionales. Cada punto, cada costura, cada detalle es una decisión tomada con cariño.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--gray-warm)' }}>
            No fabricamos peluches en serie. Creamos guardianes de recuerdos, uno por uno, para personas que merecen lo mejor.
          </p>
          <p style={{ marginTop: 28, fontFamily: "'Quicksand', sans-serif", fontStyle: 'italic', color: 'var(--coral)', fontSize: 22, fontWeight: 600 }}>
            — Con amor, el equipo MIMITTOS
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 sm:px-8 py-16" style={{ background: 'var(--navy)', color: '#fff' }}>
        <div className="mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center" style={{ maxWidth: 1100 }}>
          {[['+ 2.400', 'peluches creados'], ['+1.800', 'familias felices'], ['8', 'años de historia'], ['4.9★', 'valoración media']].map(([num, label]) => (
            <div key={num}>
              <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 54, color: 'var(--coral-warm)', lineHeight: 1 }}>{num}</div>
              <div style={{ fontSize: 13, opacity: .8, marginTop: 8, letterSpacing: '.05em' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="px-4 sm:px-8 py-16 md:py-[90px]" style={{ background: 'var(--cream-warm)' }}>
        <div style={{ maxWidth: 780, margin: '0 auto 60px', textAlign: 'center' }}>
          <div style={eyebrowStyle}>Nuestros valores</div>
          <h2 style={h2Style}>Lo que nos guía cada día.</h2>
        </div>
        <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ maxWidth: 1200 }}>
          {[
            { emoji: '🧵', title: 'Artesanía', desc: 'Cada punto es una decisión. No producimos en masa — creamos pieza por pieza con dedicación.' },
            { emoji: '♡', title: 'Cariño', desc: 'Ponemos el corazón en cada creación. Porque sabemos que alguien especial lo va a abrazar.' },
            { emoji: '🌿', title: 'Responsabilidad', desc: 'Materiales hipoalergénicos, proveedores locales y empaques sostenibles.' },
            { emoji: '✨', title: 'Personalización', desc: 'Cada peluche es único porque cada historia es única. Tú eliges, nosotros creamos.' },
          ].map(({ emoji, title, desc }) => (
            <div key={title} style={{ background: '#fff', borderRadius: 20, padding: '32px 24px', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 18 }}>{emoji}</div>
              <h4 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--navy)', marginBottom: 10 }}>{title}</h4>
              <p style={{ fontSize: 14, color: 'var(--gray-warm)', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="px-4 sm:px-8 py-16 md:py-[90px]" style={{ background: '#fff' }}>
        <div style={{ maxWidth: 780, margin: '0 auto 60px', textAlign: 'center' }}>
          <div style={eyebrowStyle}>Nuestra trayectoria</div>
          <h2 style={h2Style}>8 años creando abrazos a mano.</h2>
        </div>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
          {[
            { year: '2016', title: 'Los primeros peluches', desc: 'Todo comenzó en la mesa del comedor de Medellín, con tela, aguja e hilo. Los primeros 10 peluches fueron regalos para amigos y familia.' },
            { year: '2018', title: 'Las primeras ventas', desc: 'La voz a voz hizo magia. Empezamos a vender por Instagram con pedidos personalizados hechos uno a uno.' },
            { year: '2020', title: 'El taller propio', desc: 'Abrimos nuestro primer taller con 3 artesanas locales. Creamos el configurador visual para facilitar los pedidos.' },
            { year: '2022', title: 'Envíos a toda Colombia', desc: 'Llegamos a cada rincón del país. Más de 1.000 peluches entregados con el sistema de abono y contraentrega.' },
            { year: '2024', title: 'MIMITTOS hoy', desc: 'Más de 2.400 peluches creados, 1.800 familias felices y una comunidad que crece con cada abrazo que damos.' },
          ].map(({ year, title, desc }, i) => (
            <div key={year} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--coral)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 13, flexShrink: 0, boxShadow: '0 0 0 6px var(--cream-peach)' }}>{year}</div>
              <div style={{ background: 'var(--cream-warm)', borderRadius: 18, padding: 24, flex: 1 }}>
                <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--navy)', marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'var(--gray-warm)', lineHeight: 1.6 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-8 py-16 md:py-[90px]" style={{ textAlign: 'center', background: 'var(--cream-peach)' }}>
        <h2 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 48, color: 'var(--navy)', marginBottom: 16 }}>
          ¿Listo para crear tu recuerdo?
        </h2>
        <p style={{ fontSize: 17, color: 'var(--gray-warm)', maxWidth: 580, margin: '0 auto 32px' }}>
          Diseña tu peluche en menos de 5 minutos y nosotros lo haremos a mano con todo el amor del mundo.
        </p>
        <div style={{ display: 'inline-flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/products/1" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 28px', borderRadius: 999, fontWeight: 600, fontSize: 15, background: 'var(--coral)', color: '#fff', boxShadow: '0 8px 22px rgba(212,132,138,.35)' }}>
            Diseñar mi peluche →
          </Link>
          <Link href="/catalog" style={{ display: 'inline-flex', alignItems: 'center', padding: '16px 28px', borderRadius: 999, fontWeight: 600, fontSize: 15, color: 'var(--navy)', background: '#fff', border: '1.5px solid rgba(27,42,74,.08)' }}>
            Ver catálogo
          </Link>
        </div>
      </section>
    </main>
  )
}

const eyebrowStyle: React.CSSProperties = {
  color: 'var(--coral)', fontFamily: "'Quicksand', sans-serif",
  fontWeight: 600, fontSize: 14, letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 10,
}

const h2Style: React.CSSProperties = {
  fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 44,
  color: 'var(--navy)', marginBottom: 14,
}

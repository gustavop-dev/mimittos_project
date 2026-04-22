'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import { useCartStore } from '@/lib/stores/cartStore'

const PRODUCTS = [
  { img: '/mimittos/prod-01.svg', name: 'Osito Coral', tag: 'Más vendido', tagType: 'coral', price: '$85.000', colors: ['#D4848A', '#F5E6D3', '#FFD4D4', '#8B7E7E'] },
  { img: '/mimittos/prod-02.svg', name: 'Conejito Lucía', tag: 'Nuevo', tagType: '', price: '$92.000', colors: ['#FFD4D4', '#FFF0E8', '#D49292'] },
  { img: '/mimittos/prod-03.svg', name: 'Zorro Amiguito', tag: '', tagType: '', price: '$98.000', colors: ['#D49292', '#B8696F', '#F5E6D3'] },
  { img: '/mimittos/prod-04.svg', name: 'Elefantito Dulce', tag: 'Edición limitada', tagType: 'navy', price: '$110.000', colors: ['#8B7E7E', '#FFD4D4', '#FFE5E5'] },
]

const FAQS = [
  { q: '¿Cuánto tarda en llegar mi peluche?', a: 'Nuestros peluches se cosen a mano en 4 a 6 días hábiles. Después del envío, llega a tu puerta en 2 a 5 días según tu ciudad. Te avisamos cada etapa del proceso.' },
  { q: '¿Cómo funciona el abono y el contraentrega?', a: 'Abonas el 50% del valor para iniciar la producción (por PSE, tarjeta, Nequi o Efecty). El saldo restante lo pagas cuando recibes tu peluche en casa, al repartidor.' },
  { q: '¿De qué materiales son los peluches?', a: 'Usamos peluche premium hipoalergénico, relleno siliconado y bordados a mano. Todos nuestros materiales son seguros para niños desde los 0 meses.' },
  { q: '¿Puedo cambiar el diseño después de pedir?', a: 'Sí, mientras tu peluche aún no haya entrado a producción puedes modificarlo sin costo. Solo escríbenos por WhatsApp y con gusto te acompañamos en los cambios.' },
  { q: '¿Hacen envíos fuera de Colombia?', a: 'Por ahora solo enviamos dentro de Colombia, pero muy pronto llevaremos los abrazos MIMITTOS a toda Latinoamérica 💌' },
  { q: '¿Puedo pedir un modelo que no está en el catálogo?', a: '¡Por supuesto! Escríbenos por WhatsApp con tu idea y nuestro equipo te acompaña para crearlo especialmente para ti.' },
]

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const addToCart = useCartStore((s) => s.addToCart)

  return (
    <main>
      {/* HERO */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(circle at 85% 15%, #FFE5E5 0%, transparent 45%), radial-gradient(circle at 10% 90%, #FFF0E8 0%, transparent 55%), var(--cream-warm)',
      }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '72px 40px 100px', display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid rgba(212,132,138,.2)', padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, color: 'var(--terracotta)', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--coral)', boxShadow: '0 0 0 4px rgba(212,132,138,.2)', display: 'inline-block' }} />
              Hecho con amor en Colombia
            </span>
            <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 68, lineHeight: 1.02, marginTop: 24, color: 'var(--navy)', letterSpacing: '-.02em' }}>
              Cada abrazo guarda un{' '}
              <em style={{ fontStyle: 'normal', color: 'var(--coral)', position: 'relative', display: 'inline-block' }}>recuerdo</em>{' '}
              único.
            </h1>
            <p style={{ marginTop: 22, fontSize: 19, lineHeight: 1.55, maxWidth: 520, color: 'var(--gray-warm)', fontWeight: 400 }}>
              Peluches artesanales que llevan tu historia. Diseña el tuyo — elige modelo, tamaño y color — y nosotros lo creamos a mano, pensando en ti.
            </p>
            <div style={{ marginTop: 36, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <Link href="/products/1" style={btnPrimary}>
                Diseña tu peluche
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
              <Link href="/catalog" style={btnGhost}>Explorar catálogo</Link>
            </div>
            <div style={{ marginTop: 40, display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { icon: heartPath, text: '+2.400 peluches creados' },
                { icon: sunPath, text: 'Abono 50%, saldo contraentrega' },
                { icon: truckPath, text: 'Envío a toda Colombia' },
              ].map(({ icon, text }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--navy)', fontSize: 14, fontWeight: 600 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="1.8"><path d={icon} /></svg>
                  {text}
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative', minHeight: 560 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', background: 'var(--pink-melo)' }}>
              <Image src="https://images.unsplash.com/photo-1558603668-6570496b66f8?w=1200&q=80" alt="Peluche MIMITTOS" fill className="object-cover" />
            </div>
            <div style={{ position: 'absolute', top: '-16px', right: 40, width: 92, height: 92, borderRadius: '50%', background: 'var(--coral)', color: '#fff', display: 'grid', placeItems: 'center', textAlign: 'center', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 13, lineHeight: 1.15, boxShadow: 'var(--shadow-md)', padding: 12 }}>
              Hecho<br />con<br />amor ♡
            </div>
            <div style={{ position: 'absolute', top: 24, left: -30, background: '#fff', borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-md)' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--pink-melo)', display: 'grid', placeItems: 'center', color: 'var(--coral)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></svg>
              </div>
              <div>
                <strong style={{ display: 'block', fontFamily: "'Quicksand', sans-serif", fontSize: 15, color: 'var(--navy)', fontWeight: 700 }}>100% artesanal</strong>
                <span style={{ fontSize: 12, color: 'var(--gray-warm)' }}>Cosido a mano, uno por uno</span>
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: -30, right: -20, background: '#fff', borderRadius: 'var(--radius-md)', padding: 18, display: 'flex', flexDirection: 'column', gap: 12, width: 240, boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>Tu peluche está listo 🧸</div>
              <div style={{ height: 6, background: 'var(--pink-melo)', borderRadius: 999, overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: '66%', background: 'linear-gradient(90deg,var(--coral),var(--coral-soft))', borderRadius: 999 }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray-warm)', display: 'flex', justifyContent: 'space-between' }}>
                <span>En producción</span><b style={{ color: 'var(--terracotta)', fontWeight: 700 }}>Día 4 de 6</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section style={{ background: '#fff', borderTop: '1px solid rgba(212,132,138,.08)', borderBottom: '1px solid rgba(212,132,138,.08)' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '28px 40px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 40, alignItems: 'center' }}>
          {[
            { icon: shieldPath, title: 'Compra segura', sub: 'Pago por PSE, tarjeta o Nequi' },
            { icon: truckPath, title: 'Envío nacional', sub: 'A toda Colombia en 2-5 días' },
            { icon: clockPath, title: 'Produce en 6 días', sub: 'Hecho a mano pensando en ti' },
            { icon: chatPath, title: 'Estamos aquí', sub: 'Escríbenos por WhatsApp' },
          ].map(({ icon, title, sub }) => (
            <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'var(--pink-melo)', color: 'var(--coral)', flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d={icon} /></svg>
              </div>
              <div>
                <strong style={{ display: 'block', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, color: 'var(--navy)', fontSize: 15 }}>{title}</strong>
                <span style={{ fontSize: 13, color: 'var(--gray-warm)' }}>{sub}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '100px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, gap: 40 }}>
          <div>
            <div style={eyebrowStyle}>Explora por categoría</div>
            <h2 style={h2Style}>Cada peluche cuenta una historia diferente</h2>
          </div>
          <p style={{ color: 'var(--gray-warm)', fontSize: 16, maxWidth: 420, lineHeight: 1.55 }}>
            Oseznos, conejitos, amigos del bosque y personajes únicos — todos listos para personalizarse a tu gusto.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
          {[
            { img: 'https://images.unsplash.com/photo-1527430253228-e93688616381?w=800&q=80', name: 'Ositos clásicos', count: '24 modelos' },
            { img: 'https://images.unsplash.com/photo-1563396983906-b3795482a59a?w=800&q=80', name: 'Conejitos', count: '12 modelos' },
            { img: '/mimittos/ph-forest.svg', name: 'Amigos del bosque', count: '18 modelos' },
            { img: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=800&q=80', name: 'Ediciones especiales', count: '8 modelos' },
          ].map(({ img, name, count }) => (
            <Link key={name} href="/catalog" style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '4/5', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', display: 'block' }}>
              <Image src={img} alt={name} fill className="object-cover" />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 40%,rgba(27,42,74,.65))' }} />
              <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10 }}>
                <div>
                  <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 22, marginBottom: 2 }}>{name}</h3>
                  <span style={{ fontSize: 13, opacity: .9 }}>{count}</span>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', color: 'var(--coral)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px 100px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, gap: 40 }}>
          <div>
            <div style={eyebrowStyle}>Los más queridos</div>
            <h2 style={h2Style}>Peluches destacados de la semana</h2>
          </div>
          <Link href="/catalog" style={{ ...btnGhost, padding: '12px 22px', fontSize: 14 } as React.CSSProperties}>Ver todos →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 22 }}>
          {PRODUCTS.map((p) => (
            <div key={p.name} style={{ background: '#fff', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', aspectRatio: '1/1', background: 'var(--pink-melo)', overflow: 'hidden' }}>
                {p.tag && (
                  <span style={{ position: 'absolute', top: 14, left: 14, background: p.tagType === 'coral' ? 'var(--coral)' : p.tagType === 'navy' ? 'var(--navy)' : '#fff', color: p.tagType ? '#fff' : 'var(--terracotta)', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', padding: '6px 12px', borderRadius: 999, boxShadow: 'var(--shadow-sm)', zIndex: 1 }}>{p.tag}</span>
                )}
                <Image src={p.img} alt={p.name} fill className="object-cover" />
              </div>
              <div style={{ padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h4 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>{p.name}</h4>
                <div style={{ fontSize: 13, color: 'var(--gray-warm)' }}>Personalizable · 3 tamaños</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {p.colors.map((c) => <span key={c} style={{ width: 14, height: 14, borderRadius: '50%', background: c, border: '1.5px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,.08)', display: 'inline-block' }} />)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px dashed rgba(212,132,138,.2)' }}>
                  <div>
                    <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--terracotta)' }}>{p.price}</div>
                    <small style={{ fontWeight: 500, fontSize: 12, color: 'var(--gray-warm)' }}>desde</small>
                  </div>
                  <button
                    style={{ background: 'var(--coral)', color: '#fff', width: 38, height: 38, borderRadius: '50%', display: 'grid', placeItems: 'center', border: 'none', cursor: 'pointer' }}
                    onClick={() => addToCart({ id: Math.random(), title: p.name, price: parseInt(p.price.replace(/\D/g, '')), gallery_urls: [p.img], category: 'peluche', description: '' } as any)}
                    aria-label="Agregar al carrito"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROCESS */}
      <section style={{ background: 'var(--cream-peach)', padding: '100px 0' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={eyebrowStyle}>Cómo funciona</div>
            <h2 style={{ ...h2Style, textAlign: 'center' }}>De tu idea al abrazo, en 4 momentos.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
            {[
              { n: '01', title: 'Diseña', desc: 'Eliges modelo, tamaño y color en nuestro configurador visual. Sin escribir un solo mensaje.' },
              { n: '02', title: 'Abonas el 50%', desc: 'Pagas la mitad por PSE, tarjeta o Nequi para iniciar la producción de tu peluche.' },
              { n: '03', title: 'Creamos a mano', desc: 'En 4 a 6 días, cosemos tu peluche con los materiales más suaves. Te avisamos cada etapa.' },
              { n: '04', title: 'Lo recibes', desc: 'Llega a tu puerta, pagas el saldo contraentrega y le das el primer abrazo. Así de simple.' },
            ].map(({ n, title, desc }) => (
              <div key={n} style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 32, boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 300, fontSize: 56, color: 'var(--pink-pastel)', lineHeight: 1, marginBottom: 12 }}>{n}</div>
                <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--navy)', marginBottom: 10 }}>{title}</h3>
                <p style={{ color: 'var(--gray-warm)', fontSize: 14, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STORY */}
      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '100px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 70, alignItems: 'center' }}>
          <div style={{ position: 'relative', aspectRatio: '4/5' }}>
            <div style={{ position: 'absolute', inset: '0 30px 30px 0', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
              <Image src="https://images.unsplash.com/photo-1596463059283-da257325bab8?w=900&q=80" alt="Taller artesanal" fill className="object-cover" />
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '60%', aspectRatio: '1/1', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '8px solid var(--cream-warm)', boxShadow: 'var(--shadow-lg)' }}>
              <Image src="/mimittos/ph-detail.svg" alt="Detalle artesanal" fill className="object-cover" />
            </div>
            <div style={{ position: 'absolute', top: 30, left: -20, background: '#fff', padding: '14px 20px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-md)' }}>
              <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 28, color: 'var(--coral)', lineHeight: 1 }}>8<br /><span style={{ fontSize: 14 }}>años</span></div>
              <div style={{ fontSize: 12, color: 'var(--gray-warm)', lineHeight: 1.3 }}>creando<br />abrazos<br />a mano</div>
            </div>
          </div>
          <div>
            <div style={eyebrowStyle}>Nuestra historia</div>
            <h2 style={h2Style}>Más que peluches, guardianes de recuerdos.</h2>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: 'var(--navy)', marginBottom: 18, fontWeight: 500 }}>
              MIMITTOS nació en un pequeño taller lleno de telas, hilos y sueños, donde cada peluche empieza con la misma pregunta: <em style={{ color: 'var(--coral)', fontStyle: 'normal', fontWeight: 600 }}>¿qué momento quieres recordar?</em>
            </p>
            <p style={{ color: 'var(--gray-warm)', fontSize: 15, lineHeight: 1.7, marginBottom: 14 }}>
              Cada pieza es cosida a mano, pensada para quien la va a abrazar. Sabemos que un peluche puede ser el primer amigo de un bebé, el regalo que une a dos personas, el recuerdo que acompaña una noche larga.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 30, paddingTop: 30, borderTop: '1px solid rgba(212,132,138,.2)' }}>
              {[['+ 2.400', 'peluches creados'], ['+1.800', 'familias felices'], ['4.9★', 'valoración media']].map(([num, label]) => (
                <div key={num}>
                  <strong style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 32, color: 'var(--coral)', display: 'block', lineHeight: 1 }}>{num}</strong>
                  <span style={{ fontSize: 13, color: 'var(--gray-warm)' }}>{label}</span>
                </div>
              ))}
            </div>
            <Link href="/about" style={{ ...btnPrimary, display: 'inline-flex', marginTop: 32 } as React.CSSProperties}>Conoce nuestra historia →</Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ background: 'linear-gradient(180deg,var(--cream-warm),var(--pink-melo) 100%)', padding: '100px 0' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={eyebrowStyle}>Historias de abrazos</div>
            <h2 style={{ ...h2Style, textAlign: 'center' }}>Lo que dicen quienes ya tienen el suyo.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {[
              { text: 'Le pedí uno para el cumpleaños de mi hija y lloré cuando llegó. Está cosido con un cariño que se siente al tocarlo. Ya le estamos pidiendo otro para el bebé que viene en camino.', name: 'Valentina R.', city: 'Medellín, Colombia', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' },
              { text: 'Pedí un conejito personalizado como regalo y el configurador fue clarísimo. Todo el proceso fue rápido y siempre me tuvieron al tanto. El peluche es hermosísimo, se nota que está hecho con amor.', name: 'Andrés M.', city: 'Bogotá, Colombia', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80' },
              { text: 'La atención fue personal, cálida, como hablar con una amiga. Me ayudaron a elegir el color y el resultado superó lo que esperaba. Mi sobrina no lo suelta.', name: 'Laura P.', city: 'Cali, Colombia', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80' },
            ].map(({ text, name, city, img }) => (
              <div key={name} style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 32, boxShadow: 'var(--shadow-sm)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -18, left: 28, width: 44, height: 44, borderRadius: '50%', background: 'var(--coral)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 28 }}>"</div>
                <div style={{ color: 'var(--coral)', marginBottom: 14, fontSize: 16, letterSpacing: 2 }}>★★★★★</div>
                <p style={{ color: 'var(--navy)', fontSize: 15, lineHeight: 1.65, marginBottom: 24, minHeight: 120 }}>{text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px dashed rgba(212,132,138,.2)', paddingTop: 18 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: 'var(--pink-melo)', flexShrink: 0, position: 'relative' }}>
                    <Image src={img} alt={name} fill className="object-cover" />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{name}</strong>
                    <span style={{ fontSize: 12, color: 'var(--gray-warm)' }}>{city}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ maxWidth: 1360, margin: '0 auto', padding: '100px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={eyebrowStyle}>Preguntas frecuentes</div>
          <h2 style={{ ...h2Style, textAlign: 'center' }}>Resolvemos tus dudas con cariño.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 'var(--radius-md)', padding: '20px 24px', boxShadow: 'var(--shadow-sm)', cursor: 'pointer' }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
                <strong style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>{faq.q}</strong>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: openFaq === i ? 'var(--coral)' : 'var(--pink-melo)', color: openFaq === i ? '#fff' : 'var(--coral)', display: 'grid', placeItems: 'center', flexShrink: 0, transition: 'transform .25s', transform: openFaq === i ? 'rotate(180deg)' : 'none' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
                </div>
              </div>
              {openFaq === i && <p style={{ marginTop: 14, fontSize: 14, color: 'var(--gray-warm)', lineHeight: 1.65 }}>{faq.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ maxWidth: 1360, margin: '40px auto 60px', background: 'var(--navy)', color: '#fff', borderRadius: 'var(--radius-xl)', padding: 70, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 60, alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 90% 30%, rgba(212,132,138,.3), transparent 45%), radial-gradient(circle at 10% 80%, rgba(244,168,150,.25), transparent 50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 46, lineHeight: 1.08, letterSpacing: '-.02em', marginBottom: 16 }}>
            ¿Listo para crear un <em style={{ fontStyle: 'normal', color: 'var(--coral-soft)' }}>recuerdo</em> que abraza?
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.55, opacity: .82, marginBottom: 30, maxWidth: 440 }}>
            Diseña tu peluche en menos de 5 minutos. Sin mensajes, sin esperas, sin malentendidos.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/products/1" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 28px', borderRadius: 999, fontWeight: 600, fontSize: 15, background: '#fff', color: 'var(--navy)', transition: 'all .2s' }}>
              Diseñar mi peluche
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
            <Link href="/catalog" style={{ display: 'inline-flex', alignItems: 'center', padding: '16px 28px', borderRadius: 999, fontWeight: 600, fontSize: 15, background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,.25)' }}>
              Ver catálogo completo
            </Link>
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Image src="/mimittos/logo-light-big.png" alt="MIMITTOS" width={280} height={280} style={{ opacity: .95 }} />
        </div>
      </section>
    </main>
  )
}

const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 10, justifyContent: 'center',
  padding: '16px 28px', borderRadius: 999, fontWeight: 600, fontSize: 15,
  background: 'var(--coral)', color: '#fff',
  boxShadow: '0 8px 22px rgba(212,132,138,.35)', transition: 'all .2s',
}

const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 10, justifyContent: 'center',
  padding: '16px 28px', borderRadius: 999, fontWeight: 600, fontSize: 15,
  color: 'var(--navy)', background: '#fff', border: '1.5px solid rgba(27,42,74,.08)',
  transition: 'all .2s',
}

const eyebrowStyle: React.CSSProperties = {
  color: 'var(--coral)', fontFamily: "'Quicksand', sans-serif",
  fontWeight: 600, fontSize: 14, letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 10,
}

const h2Style: React.CSSProperties = {
  fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 46,
  color: 'var(--navy)', lineHeight: 1.1, letterSpacing: '-.02em',
}

const heartPath = 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z'
const sunPath = 'M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-7.07-1.41 1.41M6.34 17.66l-1.41 1.41m12.72 0-1.41-1.41M6.34 6.34 4.93 4.93'
const truckPath = 'M5 12V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M21 15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3h18z'
const shieldPath = 'M12 2 4 6v6c0 5 3.5 9.7 8 10 4.5-.3 8-5 8-10V6l-8-4z M9 12l2 2 4-4'
const clockPath = 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v6l4 2'
const chatPath = 'M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z'

import Link from 'next/link'

const SECTIONS = [
  {
    title: '1. Quiénes somos',
    content: 'MIMITTOS es una empresa artesanal colombiana dedicada a la creación de peluches personalizados hechos a mano. Con sede en Medellín, Antioquia, operamos principalmente a través de nuestro sitio web y atendemos pedidos en todo el territorio nacional.',
  },
  {
    title: '2. Proceso de compra y pago',
    content: 'El proceso de compra funciona en dos etapas: (1) Al confirmar tu pedido, abonas el 50% del valor total mediante PSE, tarjeta de crédito/débito, Nequi o Efecty. (2) El 50% restante se cancela contra entrega, directamente al mensajero cuando recibes tu peluche. No iniciamos la producción hasta recibir el abono inicial.',
  },
  {
    title: '3. Tiempos de producción y entrega',
    content: 'El tiempo de producción estándar es de 4 a 6 días hábiles desde la confirmación del pago del abono. El tiempo de entrega depende de tu ciudad y oscila entre 2 y 5 días hábiles adicionales. Recibirás notificaciones por correo y WhatsApp en cada etapa del proceso.',
  },
  {
    title: '4. Política de personalización',
    content: 'Puedes modificar tu pedido sin costo adicional siempre que la producción no haya comenzado. Una vez iniciada la producción, los cambios pueden tener un costo adicional o no ser posibles. Contáctanos por WhatsApp lo antes posible si necesitas hacer modificaciones.',
  },
  {
    title: '5. Garantía y reparaciones',
    content: 'Todos los peluches MIMITTOS tienen garantía de por vida contra defectos de fabricación. Si tu peluche sufre un accidente (daño por uso), también ofrecemos servicio de reparación con cariño, con costos mínimos según el tipo de reparación. Escríbenos por WhatsApp para solicitar garantía o reparación.',
  },
  {
    title: '6. Devoluciones y cambios',
    content: 'Dado el carácter personalizado de nuestros productos, no aceptamos devoluciones por cambio de opinión. Sin embargo, si el producto presenta defectos de fabricación o no corresponde a lo acordado, lo reemplazamos sin costo alguno. En ese caso, el abono inicial es reembolsado en su totalidad.',
  },
  {
    title: '7. Privacidad y datos personales',
    content: 'Recopilamos únicamente los datos necesarios para procesar tu pedido (nombre, correo, teléfono, dirección de envío). No vendemos ni compartimos tu información con terceros, excepto con las empresas de mensajería necesarias para el envío. Tus datos son tratados conforme a la Ley 1581 de 2012 (Habeas Data) de Colombia.',
  },
  {
    title: '8. Envíos',
    content: 'Actualmente hacemos envíos a todo el territorio colombiano. El costo de envío varía según la ciudad destino y se calcula al momento del checkout. Los pedidos superiores a $300.000 tienen envío gratis a ciudades principales. No realizamos envíos internacionales por el momento.',
  },
  {
    title: '9. Contacto y soporte',
    content: 'Para cualquier consulta, puedes contactarnos por WhatsApp al +57 300 000 0000 (lunes a viernes, 8am–7pm) o por correo a hola@mimittos.co. Nos comprometemos a responder en menos de 24 horas hábiles.',
  },
]

export default function TermsPage() {
  return (
    <main>
      {/* Breadcrumb */}
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '20px 40px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-warm)' }}>
        <Link href="/" style={{ color: 'var(--gray-warm)' }}>Inicio</Link>
        <span style={{ opacity: .5 }}>/</span>
        <b style={{ color: 'var(--navy)', fontWeight: 700 }}>Términos y Condiciones</b>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 40px 80px' }}>
        <div style={{ color: 'var(--coral)', fontFamily: "'Quicksand', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 8 }}>Legal</div>
        <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 48, color: 'var(--navy)', letterSpacing: '-.02em', lineHeight: 1.08, marginBottom: 14 }}>
          Términos y Condiciones
        </h1>
        <p style={{ color: 'var(--gray-warm)', fontSize: 15, lineHeight: 1.6, marginBottom: 40 }}>
          Última actualización: 18 de abril de 2026. Al realizar un pedido en MIMITTOS, aceptas los siguientes términos y condiciones.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {SECTIONS.map((s) => (
            <div key={s.title} style={{ background: '#fff', borderRadius: 'var(--radius-md)', padding: '28px 32px', boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--navy)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--coral)', display: 'inline-block', flexShrink: 0 }} />
                {s.title}
              </h2>
              <p style={{ color: 'var(--gray-warm)', fontSize: 15, lineHeight: 1.7 }}>{s.content}</p>
            </div>
          ))}
        </div>

        <div style={{ background: 'linear-gradient(135deg,var(--cream-peach),var(--pink-melo))', borderRadius: 'var(--radius-lg)', padding: 32, marginTop: 40, textAlign: 'center' }}>
          <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 22, color: 'var(--navy)', marginBottom: 10 }}>
            ¿Tienes alguna pregunta sobre nuestros términos?
          </h3>
          <p style={{ color: 'var(--gray-warm)', fontSize: 15, marginBottom: 20 }}>
            Estamos para ayudarte. Escríbenos y te explicamos con gusto.
          </p>
          <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 999, fontWeight: 700, fontSize: 15, background: 'var(--coral)', color: '#fff' }}>
            Contáctanos →
          </Link>
        </div>
      </div>
    </main>
  )
}

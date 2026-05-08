import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  description:
    'Ingresa a tu cuenta MIMITTOS para ver tus pedidos, seguir el estado de producción de tu peluche y guardar tus modelos favoritos.',
  alternates: { canonical: '/sign-in' },
  robots: { index: false, follow: true },
}

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children
}

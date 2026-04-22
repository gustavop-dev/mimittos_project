import type { Metadata } from 'next';
import './globals.css';
import PublicChrome from '@/components/layout/PublicChrome';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'MIMITTOS — Más que un peluche, un recuerdo',
  description: 'Peluches artesanales hechos a mano en Colombia, personalizados para ti.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Nunito:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <PublicChrome>
            {children}
          </PublicChrome>
        </Providers>
      </body>
    </html>
  );
}

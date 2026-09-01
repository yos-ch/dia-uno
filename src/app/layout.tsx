import type { Metadata, Viewport } from 'next';
import { Familjen_Grotesk, Public_Sans } from 'next/font/google';
import './globals.css';

const display = Familjen_Grotesk({
  subsets: ['latin'], variable: '--fuente-display', weight: ['500', '600', '700'],
});
const cuerpo = Public_Sans({
  subsets: ['latin'], variable: '--fuente-cuerpo', weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Día Uno',
  description:
    'Tu arco no empieza en invierno. Empieza el día que decides ser tu mejor versión.',
  openGraph: {
    title: 'Día Uno',
    description:
      'Tu arco no empieza en invierno. Empieza el día que decides ser tu mejor versión.',
    type: 'website',
  },
};

export const viewport: Viewport = { themeColor: '#0B111C' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${cuerpo.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Juanita La Legal — Orientación legal en buen chileno',
  description: 'Primera orientación legal clara, rápida y pagable. Consulta por $9.990.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

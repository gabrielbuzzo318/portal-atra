import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ATRIA Contabilidade - Portal',
  description: 'Portal de documentos da ATRIA Contabilidade',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

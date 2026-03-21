import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kinetikos Knowledge Copilot',
  description: 'Japanese-first grounded RAG chat experience for Kinetikos',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

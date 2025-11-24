import type { Metadata } from 'next';
import './globals.css';
import SuiWalletProvider from '@/components/WalletProvider';

export const metadata: Metadata = {
  title: 'VRAM.AI Arena',
  description: 'Decentralized AI Agent Tournament Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SuiWalletProvider>
          {children}
        </SuiWalletProvider>
      </body>
    </html>
  );
}

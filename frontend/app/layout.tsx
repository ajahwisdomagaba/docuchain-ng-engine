import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NavSidebar } from '../components/nav-sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DocuChain NG - Statutory Contract Redlining & Vault',
  description: 'Automated legal contract compliance and redlining under Nigerian Law',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen flex antialiased`}>
        <NavSidebar />
        <main className="flex-1 overflow-y-auto min-h-screen bg-slate-50 p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import AppShell from '@/components/AppShell';
import DevTierSwitcher from '@/components/DevTierSwitcher';

export const metadata = {
  title: 'DocuChain.NG — Context-Aware Contract Intelligence for Nigerian Businesses',
  description: 'AI-powered contract auditing, statutory benchmarking, and obligation monitoring under Nigerian Law.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-slate-950 text-slate-100 min-h-screen antialiased">
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
          {process.env.NODE_ENV === 'development' ? <DevTierSwitcher /> : null}
        </AuthProvider>
      </body>
    </html>
  );
}
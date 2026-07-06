import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'DevMetrics AI — Engineering Analytics',
  description: 'AI-powered developer productivity dashboard for engineering teams',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="bottom-right" toastOptions={{
          style: { background: '#18181b', color: '#e4e4e7', border: '1px solid #3f3f46' },
        }} />
      </body>
    </html>
  );
}

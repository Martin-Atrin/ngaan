import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { LIFFProvider } from '@/components/providers/LIFFProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Ngaan - Family Task Manager',
  description: 'LINE Mini App for family task management with blockchain rewards',
  keywords: 'family, tasks, chores, blockchain, LINE, rewards, KAIA',
  authors: [{ name: 'Ngaan Team' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#00B900',
  openGraph: {
    title: 'Ngaan - Family Task Manager',
    description: 'Gamified family task management with blockchain rewards',
    type: 'website',
    locale: 'en_US',
  },
  robots: {
    index: false, // Private mini app
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryProvider>
          <LIFFProvider>
            <div className="min-h-screen bg-background">
              {children}
            </div>
          </LIFFProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
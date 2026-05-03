import type { Metadata } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import type { ReactNode } from 'react';

import { Sidebar } from '../components/sidebar';

import './globals.css';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'SOC SOAR Platform',
  description: 'SOAR-oriented SOC automation thesis workspace',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={ibmPlexSans.className}>
        <div className="lg:flex">
          <Sidebar />
          <main className="min-h-screen flex-1 p-4 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}

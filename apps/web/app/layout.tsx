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
  title: 'SOARisk - Nền tảng SOAR cho SOC',
  description: 'Nền tảng tự động hóa SOC theo định hướng SOAR',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
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

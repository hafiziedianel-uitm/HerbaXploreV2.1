import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { ThemeProvider } from '@/components/ThemeProvider';
import { LanguageProvider } from '@/lib/LanguageContext';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'HerbaXplorer © | Faculty of Pharmacy UiTM',
  description: 'Fakulti Farmasi UiTM - HerbaXplorer © Aplikasi Web Visualisasi 3D Farmakognosi',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="antialiased">
        <script src="https://3Dmol.org/build/3Dmol-min.js" async />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

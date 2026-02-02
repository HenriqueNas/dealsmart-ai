import type { Metadata } from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const interSans = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
});

const firaCode = Fira_Code({
  variable: '--font-fira-code',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'DealSmart AI | Communications Hub',
  description:
    'AI-powered customer communications platform for dealerships. Manage conversations, collaborate with AI on responses, and sync with HubSpot CRM.',
  keywords: [
    'dealership',
    'AI',
    'communications',
    'CRM',
    'HubSpot',
    'customer service',
  ],
  authors: [{ name: 'HenriqueNas', url: 'https://github.com/henriquenas' }],
  openGraph: {
    title: 'DealSmart AI | Communications Hub',
    description: 'AI-powered customer communications platform for dealerships.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${interSans.variable} ${firaCode.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

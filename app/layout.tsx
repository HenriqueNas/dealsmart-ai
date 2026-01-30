import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

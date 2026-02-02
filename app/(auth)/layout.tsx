import Link from 'next/link';
import Image from 'next/image';
import logo from '../../public/logo.png';
import { Header } from '../components/layout/Header';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header showNavigation={false}></Header>

      {/* Centered content */}
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';

export default function Home() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 h-screen">
      <div className="relative z-10 max-w-4xl mx-auto text-center ">
        <div className="mb-4 transition-all duration-500 opacity-100">
          <span className="text-white/30 text-[10px] sm:text-xs tracking-[0.3em] uppercase">
            Introducing Max
          </span>
        </div>
        <h1 className="mb-6 transition-all duration-700 delay-100 opacity-100 translate-y-0">
          <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight text-white tracking-tight leading-[1.1]">
            The Autonomous
          </span>
          <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight text-white/40 tracking-tight leading-[1.1]">
            Dealership
          </span>
        </h1>
        <p className="text-white/35 text-sm sm:text-base tracking-[0.15em] mb-10 max-w-lg mx-auto font-light transition-all duration-700 delay-200 opacity-100">
          The AI operating system for automotive retail
        </p>
        <div className="mb-12 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-3xl mx-auto transition-all duration-700 delay-300 opacity-100 translate-y-0">
          <div className="text-center px-4">
            <h3 className="text-white/70 text-xs sm:text-sm font-medium tracking-wide mb-2">
              Executes, Not Just Chats
            </h3>
            <p className="text-white/30 text-[11px] sm:text-xs leading-relaxed">
              Full workflows without human handoff.
            </p>
          </div>
          <div className="text-center px-4 sm:border-x sm:border-white/10">
            <h3 className="text-white/70 text-xs sm:text-sm font-medium tracking-wide mb-2">
              Learns Your Playbook
            </h3>
            <p className="text-white/30 text-[11px] sm:text-xs leading-relaxed">
              Your best practices, scaled automatically.
            </p>
          </div>
          <div className="text-center px-4">
            <h3 className="text-white/70 text-xs sm:text-sm font-medium tracking-wide mb-2">
              Compliant By Design
            </h3>
            <p className="text-white/30 text-[11px] sm:text-xs leading-relaxed">
              TCPA, DNC, opt-out handled.
            </p>
          </div>
        </div>
      </div>
      {isLoading ? (
        // Loading skeleton
        <div className="flex items-center gap-4">
          <div className="h-9 w-20 animate-pulse rounded-none bg-foreground/10" />
          <div className="h-9 w-24 animate-pulse rounded-none bg-foreground/10" />
        </div>
      ) : isAuthenticated && user ? (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-400 opacity-100 translate-y-0">
          <Link href="/dashboard">
            <Button size="lg"> Start Dealing</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-400 opacity-100 translate-y-0">
            <Link href="/login">
              <Button variant="secondary" size="lg" className="min-w-40">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="lg" className="min-w-40">
                Register
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

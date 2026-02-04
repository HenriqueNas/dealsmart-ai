'use client';

import { useAuth } from '@/app/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import Image from 'next/image';
import logo from '../../../public/logo.png';

export function Header({ showNavigation = true }) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = useCallback(async () => {
    setIsDropdownOpen(false);
    await logout();
    router.push('/');
  }, [logout, router]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#030303]/80 backdrop-blur-md min-h-16">
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 min-h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={logo}
            alt="DealSmart AI Logo"
            className="w-5 h-5 sm:w-6 sm:h-6 opacity-90"
          />
          <span className="text-white/70 text-xs sm:text-sm tracking-[0.2em] uppercase font-light">
            DealSmart AI
          </span>
        </Link>

        {/* Navigation */}
        {showNavigation && (
          <nav className="flex items-center gap">
            {isLoading ? (
              // Loading skeleton
              <div className="flex items-center gap-4">
                <div className="h-9 w-20 animate-pulse rounded-none bg-foreground/10" />
                <div className="h-9 w-24 animate-pulse rounded-none bg-foreground/10" />
              </div>
            ) : isAuthenticated && user ? (
              // Logged in state
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 rounded-none px-3 py-2 text-sm font-medium text-background bg-foreground transition-colors hover:bg-accent/70"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                >
                  <span className="hidden sm:inline">
                    {user.name || user.email.split('@')[0]}
                  </span>
                  {/* Chevron */}
                  <svg
                    className={`h-4 w-4 transition-transform ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-none border border-foreground/10 bg-background shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="p-2">
                      {/* User info */}
                      <div className="border-b border-foreground/10 px-3 py-2">
                        <p className="text-sm font-medium text-foreground">
                          {user.name || 'User'}
                        </p>
                        <p className="text-xs text-foreground/60">
                          {user.email}
                        </p>
                        <p className="mt-1 text-xs text-accent">{user.role}</p>
                      </div>

                      {/* Menu items */}
                      <div className="py-1">
                        <Link
                          href="/conversations"
                          onClick={() => setIsDropdownOpen(false)}
                          className="block rounded-none px-3 py-2 text-sm text-foreground hover:bg-foreground/5"
                        >
                          Conversations
                        </Link>
                        <Link
                          href="/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="block rounded-none px-3 py-2 text-sm text-foreground hover:bg-foreground/5"
                        >
                          Profile
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-foreground/10 pt-1">
                        <button
                          onClick={handleLogout}
                          className="block w-full rounded-none px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // <></>
              // Logged out state
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

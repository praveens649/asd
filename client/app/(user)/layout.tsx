"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getToken, getUser, logout } from "@/lib/auth";
import { User } from "@/lib/types";
import { api } from "@/lib/api";

const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Projects", href: "/projects" },
];

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = getToken();
    const storedUser = getUser();

    if (!token || !storedUser) {
      router.replace("/login");
      return;
    }

    setUser(storedUser);
    setCheckingAuth(false);
  }, [router]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    const token = getToken();

    try {
      if (token) {
        await api("/auth/logout", {
          method: "POST",
          token,
        });
      }
    } catch {
      // Even if server request fails, clear local session
    } finally {
      logout();
      router.replace("/login");
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Checking authentication...
      </div>
    );
  }

  const isLinkActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Left: Brand + Desktop Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-lg font-bold text-white tracking-tight">
              Project Management
            </Link>

            <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
              {navItems.map((item) => {
                const active = isLinkActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: User Info & Logout (Desktop) + Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-slate-200">{user.fullName}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="hidden sm:inline-flex rounded-lg border border-slate-700 px-3.5 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Logout
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex md:hidden rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-800 bg-slate-900 px-4 py-3 md:hidden">
            <nav className="space-y-1" aria-label="Mobile Navigation">
              {navItems.map((item) => {
                const active = isLinkActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-lg px-3 py-2 text-base font-medium transition ${
                      active
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {user && (
              <div className="mt-4 border-t border-slate-800 pt-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200">{user.fullName}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
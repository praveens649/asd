"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getToken, getUser, logout } from "@/lib/auth";
import { User } from "@/lib/types";
import { api } from "@/lib/api";
import {
  LayoutDashboard,
  FolderKanban,
  LogOut,
  Menu,
  X,
  User as UserIcon,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
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
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Left: Brand + Desktop Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2.5 text-lg font-bold text-foreground tracking-tight hover:text-amber-400 transition">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-105 transition">
                <FolderKanban className="h-5 w-5" />
              </div>
              <span>Project Management</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
              {navItems.map((item) => {
                const active = isLinkActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs font-semibold"
                        : "text-muted-foreground hover:bg-amber-500/10 hover:text-amber-300 hover:border hover:border-amber-500/20"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: User Info & Logout (Desktop) + Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden sm:flex items-center gap-3 border-r border-border pr-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border border-border text-xs font-semibold text-muted-foreground">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-foreground">{user.fullName}</p>
                  <p className="text-[11px] text-muted-foreground">{user.email}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-300"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex md:hidden rounded-lg p-2 text-muted-foreground hover:bg-amber-500/10 hover:text-amber-300 transition"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border bg-card px-4 py-3 md:hidden space-y-3">
            <nav className="space-y-1" aria-label="Mobile Navigation">
              {navItems.map((item) => {
                const active = isLinkActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-base font-medium transition ${
                      active
                        ? "bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30"
                        : "text-muted-foreground hover:bg-amber-500/10 hover:text-amber-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {user && (
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border border-border text-xs font-semibold text-muted-foreground">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">{user.fullName}</p>
                    <p className="text-[11px] text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-300"
                >
                  <LogOut className="h-3.5 w-3.5" />
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
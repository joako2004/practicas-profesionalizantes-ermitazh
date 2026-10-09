"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/admin/Sidebar";

interface AdminShellProps {
  user: { email?: string | null };
  initialDesktopSidebarOpen: boolean;
  children: React.ReactNode;
}

export default function AdminShell({
  user,
  initialDesktopSidebarOpen,
  children,
}: AdminShellProps) {
  const [isDesktop, setIsDesktop] = useState(true);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(
    initialDesktopSidebarOpen,
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const heroImage =
    "https://coehmfszuwczfxfpumub.supabase.co/storage/v1/object/public/propiedades-fotos/exteriores_pileta_juegos/144.jpeg";

  const sidebarOpen = isDesktop ? desktopSidebarOpen : mobileSidebarOpen;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const syncSidebarWithViewport = () => {
      setIsDesktop(mediaQuery.matches);
    };

    syncSidebarWithViewport();
    mediaQuery.addEventListener("change", syncSidebarWithViewport);

    return () => mediaQuery.removeEventListener("change", syncSidebarWithViewport);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isDesktop) {
          setDesktopSidebarOpen(false);
          document.cookie =
            "admin-sidebar-open=closed; path=/; max-age=31536000; samesite=lax";
        } else {
          setMobileSidebarOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isDesktop]);

  const toggleSidebar = () => {
    if (isDesktop) {
      setDesktopSidebarOpen((isOpen) => {
        const nextValue = !isOpen;
        document.cookie = `admin-sidebar-open=${
          nextValue ? "open" : "closed"
        }; path=/; max-age=31536000; samesite=lax`;
        return nextValue;
      });
    } else {
      setMobileSidebarOpen((isOpen) => !isOpen);
    }
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-champagne-pink [--admin-sidebar-width:15rem]">
      <header className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-clay-cream)]/80 backdrop-blur-md">
        <div className="flex h-[60px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white/10 text-[var(--color-ink)] transition-all hover:border-[var(--color-accent)] hover:bg-white/20 active:scale-[0.97]"
              aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={sidebarOpen}
              aria-controls="admin-sidebar"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
                className="h-5 w-5"
              >
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </svg>
            </button>
            <Link
              href="/admin"
              onClick={closeMobileSidebar}
              className="cursor-pointer text-xl font-semibold tracking-wide text-dark-pine transition-opacity hover:opacity-80"
            >
              Cabañas Ermitazh
            </Link>
          </div>
          <span className="max-w-[55%] truncate text-right text-sm text-dark-pine/50 sm:max-w-none">
            Conectado como{" "}
            <span className="font-medium text-dark-pine">{user.email}</span>
          </span>
        </div>
      </header>

      <div
        className={`flex min-h-0 flex-1 transition-[padding] duration-300 ease-in-out ${
          sidebarOpen ? "lg:pl-[var(--admin-sidebar-width)]" : ""
        }`}
      >
        <Sidebar isOpen={sidebarOpen} onClose={closeMobileSidebar} />
        {sidebarOpen && (
          <button
            type="button"
            onClick={closeMobileSidebar}
            className="fixed inset-x-0 bottom-0 top-[60px] z-40 bg-[var(--color-ink)]/20 backdrop-blur-[2px] lg:hidden"
            aria-label="Cerrar menú"
          />
        )}

        <section className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[var(--color-ink)]/65"
          />
          <main className="relative z-10 h-full overflow-y-auto">
            <div className="min-h-full px-6 pb-12 pt-6">
              {children}
            </div>
          </main>
        </section>
      </div>
    </div>
  );
}
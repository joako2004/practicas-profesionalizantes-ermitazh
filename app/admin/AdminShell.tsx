"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import { IMAGENES_HERO_FALLBACK } from "@/lib/config";

interface AdminShellProps {
  initialDesktopSidebarOpen: boolean;
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}

export default function AdminShell({
  initialDesktopSidebarOpen,
  header,
  footer,
  children,
}: AdminShellProps) {
  const [isDesktop, setIsDesktop] = useState(true);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(
    initialDesktopSidebarOpen,
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const heroImage = IMAGENES_HERO_FALLBACK[0].url;

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
    <div className="relative flex h-dvh flex-col overflow-hidden bg-[var(--color-bg)] [--admin-header-h:69px] [--admin-sidebar-width:15rem]">
      {header}

      <button
        type="button"
        onClick={toggleSidebar}
        aria-expanded={sidebarOpen}
        aria-controls="admin-sidebar"
        aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
        className="absolute left-4 top-[calc(var(--admin-header-h)_+_0.75rem)] z-[60] inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] shadow-md transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] active:scale-[0.97]"
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
          {sidebarOpen ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <>
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </>
          )}
        </svg>
        <span>{sidebarOpen ? "Cerrar menú" : "Menú"}</span>
      </button>

      <div className="flex min-h-0 flex-1 flex-col pt-[var(--admin-header-h)]">
        <div
          className={`flex min-h-0 flex-1 flex-col transition-[padding] duration-300 ease-in-out ${
            sidebarOpen ? "lg:pl-[var(--admin-sidebar-width)]" : ""
          }`}
        >
          <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${heroImage})` }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[var(--color-ink)]/65"
            />
            <main className="relative z-10 flex-1 overflow-y-auto">
              <div className="min-h-[calc(100dvh_-_var(--admin-header-h))] px-6 pb-16 pt-6">
                {children}
              </div>
              {footer}
            </main>
          </section>
        </div>
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={closeMobileSidebar} />
      {sidebarOpen && (
        <button
          type="button"
          onClick={closeMobileSidebar}
          className="fixed inset-x-0 bottom-0 top-[var(--admin-header-h)] z-40 bg-[var(--color-ink)]/20 backdrop-blur-[2px] lg:hidden"
          aria-label="Cerrar menú"
        />
      )}
    </div>
  );
}

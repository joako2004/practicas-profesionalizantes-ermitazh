"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/admin/Sidebar";

interface AdminShellProps {
  user: { email?: string | null };
  children: React.ReactNode;
}

export default function AdminShell({ user, children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const heroImage =
    "https://coehmfszuwczfxfpumub.supabase.co/storage/v1/object/public/propiedades-fotos/exteriores_pileta_juegos/144.jpeg";

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-champagne-pink [--admin-sidebar-width:15rem]">
      <header className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-clay-cream)]/80 backdrop-blur-md">
        <div className="flex h-[60px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-btn border border-desert-sand/40 bg-white px-3 py-2 text-sm text-dark-pine/70 shadow-sm transition-all hover:border-desert-sand active:scale-[0.97] lg:hidden"
              aria-label="Abrir menú"
            >
              ☰
            </button>
            <Link
              href="/admin"
              onClick={() => setSidebarOpen(false)}
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

      <div className="flex min-h-0 flex-1 lg:pl-[var(--admin-sidebar-width)]">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
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
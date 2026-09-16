"use client";

import { useState } from "react";
import Sidebar from "@/components/admin/Sidebar";

interface AdminShellProps {
  user: { email?: string | null };
  children: React.ReactNode;
}

export default function AdminShell({ user, children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-champagne-pink">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed left-4 top-4 z-40 lg:hidden rounded-btn bg-white border border-desert-sand/40 px-3 py-2 text-sm text-dark-pine/70 shadow-lg transition-all hover:border-desert-sand"
        aria-label="Abrir menú"
      >
        ☰
      </button>

      <div className="lg:pl-64 min-h-dvh">
        <header className="border-b border-desert-sand/20 bg-white sticky top-0 z-30">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <h1 className="text-xl font-semibold tracking-tight text-dark-pine">
              Panel de Administración
            </h1>
            <div className="flex items-center gap-4">
              <span className="hidden sm:block text-sm text-dark-pine/50">
                Conectado como{" "}
                <span className="font-medium text-dark-pine">{user.email}</span>
              </span>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="rounded-btn border border-desert-sand/40 px-4 py-2 text-sm font-medium text-dark-pine/70 transition-all hover:border-desert-sand hover:text-dark-pine active:scale-[0.97]"
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-12">{children}</main>
      </div>
    </div>
  );
}
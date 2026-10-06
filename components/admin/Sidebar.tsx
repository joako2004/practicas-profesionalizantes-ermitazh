"use client";

import type { ReactNode, SVGProps } from "react";
import Link from "next/link";

type IconName =
  | "properties"
  | "reservations"
  | "cabins"
  | "availability"
  | "prices"
  | "inquiries"
  | "reports"
  | "logout";

interface SidebarItem {
  key: string;
  label: string;
  icon: Exclude<IconName, "logout">;
  href?: string;
}

const sidebarItems: SidebarItem[] = [
  {
    key: "propiedades",
    label: "Propiedades",
    icon: "properties",
    href: "/admin/propiedades",
  },
  { key: "reservas", label: "Reservas", icon: "reservations" },
  { key: "cabanas", label: "Cabañas", icon: "cabins" },
  { key: "disponibilidad", label: "Disponibilidad", icon: "availability" },
  { key: "precios", label: "Precios", icon: "prices" },
  { key: "consultas", label: "Consultas", icon: "inquiries" },
  { key: "reportes", label: "Reportes", icon: "reports" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function SidebarIcon({
  name,
  ...props
}: { name: IconName } & SVGProps<SVGSVGElement>) {
  const iconPaths: Record<IconName, ReactNode> = {
    properties: (
      <>
        <path d="M3.5 10.5 12 3l8.5 7.5" />
        <path d="M5.5 9.5V21h13V9.5M9 21v-6h6v6" />
      </>
    ),
    reservations: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16M8 14h2M12 14h4M8 17h5" />
      </>
    ),
    cabins: (
      <>
        <path d="m3.5 11 8.5-7 8.5 7" />
        <path d="M5.5 9.5V21h13V9.5M9 21v-5h6v5" />
      </>
    ),
    availability: (
      <>
        <rect x="3.5" y="4" width="17" height="17" rx="2" />
        <path d="M7.5 3v3M16.5 3v3M3.5 9h17M7 14l2.5 2.5L16.5 11" />
      </>
    ),
    prices: (
      <>
        <path d="M12 3v18M16 7.5c0-1.4-1.8-2.5-4-2.5S8 6.1 8 7.5s1.8 2.5 4 2.5 4 1.1 4 2.5-1.8 2.5-4 2.5-4-1.1-4-2.5" />
      </>
    ),
    inquiries: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4h0A2.5 2.5 0 0 1 4 13.5z" />
        <path d="M8 8h8M8 11h5" />
      </>
    ),
    reports: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
    logout: (
      <>
        <path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10" />
        <path d="M14 8l4 4-4 4M18 12H8" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const sidebarClasses = `fixed inset-y-0 left-0 z-50 flex w-[280px] -translate-x-full flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? "translate-x-0" : ""}`;

  return (
    <aside className={sidebarClasses} aria-label="Menú lateral de administración">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-6">
        <Link href="/admin" className="block">
          <p className="font-heading text-xl font-semibold text-[var(--color-ink)]">
            Administración
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink)]/60">
            Cabañas Ermitazh
          </p>
        </Link>
        <button
          onClick={onClose}
          className="rounded-[var(--radius-sm)] p-2 text-[var(--color-ink)]/60 transition-colors hover:bg-[var(--color-warm)]/30 hover:text-[var(--color-ink)] md:hidden"
          aria-controls="sidebar"
          aria-expanded={isOpen}
          aria-label="Cerrar menú"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-4 py-6" aria-label="Secciones de administración">
        {sidebarItems.map((item) => (
          item.href ? (
            <Link
              key={item.key}
              href={item.href}
              className="group flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-3 text-sm font-medium text-[var(--color-ink)]/75 transition-all hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-ink)]"
            >
              <SidebarIcon
                name={item.icon}
                className="h-5 w-5 shrink-0 text-[var(--color-accent)] transition-colors group-hover:text-[var(--color-ink)]"
              />
              <span>{item.label}</span>
            </Link>
          ) : (
            <div
              key={item.key}
              className="group flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-3 text-sm font-medium text-[var(--color-ink)]/75 transition-all hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-ink)]"
            >
              <SidebarIcon
                name={item.icon}
                className="h-5 w-5 shrink-0 text-[var(--color-accent)] transition-colors group-hover:text-[var(--color-ink)]"
              />
              <span>{item.label}</span>
            </div>
          )
        ))}
      </nav>

      <div className="border-t border-[var(--color-border)] p-4">
        <Link
          href="/"
          className="group flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-3 text-sm font-medium text-[var(--color-danger)] transition-all hover:bg-[var(--color-danger-bg)] hover:text-[var(--color-danger)] focus:outline-none focus:ring-2 focus:ring-[var(--color-danger)]/40"
        >
          <SidebarIcon
            name="logout"
            className="h-5 w-5 shrink-0 text-[var(--color-danger)] transition-colors group-hover:text-[var(--color-ink)]"
          />
          <span>Cerrar sesión</span>
        </Link>
      </div>
    </aside>
  );
}
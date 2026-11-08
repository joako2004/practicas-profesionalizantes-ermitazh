"use client";

import type { ReactNode, SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";

type IconName =
  | "properties"
  | "reservations"
  | "photos"
  | "availability"
  | "inquiries"
  | "reports"
  | "reviews"
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
  { key: "resenas", label: "Reseñas", icon: "reviews", href: "/admin/resenas" },
  { key: "reservas", label: "Reservas", icon: "reservations" },
  { key: "fotos", label: "Fotos", icon: "photos", href: "/admin/fotos" },
  { key: "disponibilidad", label: "Disponibilidad", icon: "availability", href: "/admin/disponibilidad" },
  { key: "consultas", label: "Consultas", icon: "inquiries" },
  { key: "reportes", label: "Reportes", icon: "reports", href: "/admin/reportes" },
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
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M3 10h18" />
        <path d="M8 14h.01" />
        <path d="M12 14h.01" />
        <path d="M16 14h.01" />
        <path d="M8 18h.01" />
        <path d="M12 18h.01" />
        <path d="M16 18h.01" />
      </>
    ),
    photos: (
      <>
        <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
        <circle cx="9" cy="10" r="1.4" />
        <path d="M4 16.5 8.5 12l3.5 3.5 2.5-2.5 5 5" />
      </>
    ),
    availability: (
      <>
        <rect x="3.5" y="4" width="17" height="17" rx="2" />
        <path d="M7.5 3v3M16.5 3v3M3.5 9h17M7 14l2.5 2.5L16.5 11" />
      </>
    ),
    inquiries: (
      <>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </>
    ),
    reports: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
    reviews: (
      <>
        <path d="M12 3.5l2.6 5.3 5.9.9-4.25 4.15 1 5.85L12 16.9l-5.25 2.8 1-5.85L3.5 9.7l5.9-.9z" />
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

function useIsActive(href: string): boolean {
  const pathname = usePathname();
  // Si el href es exactamente "/admin", solo coincidencia exacta
  if (href === "/admin") return pathname === href;
  // Caso activo: pathname exacto o empieza con href + "/"
  return pathname === href || pathname.startsWith(href + "/");
}

function SidebarActiveLink({
  href,
  onClose,
  icon,
  children,
}: {
  href: string;
  onClose: () => void;
  icon: Exclude<IconName, "logout">;
  children: ReactNode;
}) {
  const isActive = useIsActive(href);
  // Clases del enlace en su estado normal
  const normalClasses =
    "group flex items-center gap-3 rounded-[var(--radius-md)] border border-transparent px-4 py-2.5 text-sm font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white";
  // Clases del enlace activo: pastilla clara de vidrio
  const activeClasses =
    "group flex items-center gap-3 rounded-[var(--radius-md)] border border-transparent px-4 py-2.5 text-sm font-medium text-white bg-white/20 aria-current=\"page\" transition-all hover:border-white/20 hover:bg-white/10 hover:text-white";

  return (
    <Link
      href={href}
      onClick={onClose}
      className={isActive ? activeClasses : normalClasses}
    >
      <SidebarIcon
        name={icon}
        className={isActive
          ? "h-5 w-5 shrink-0 transition-colors"
          : "h-5 w-5 shrink-0 transition-colors"}
      />
      <span>{children}</span>
    </Link>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const sidebarClasses = `fixed bottom-0 left-0 top-0 z-40 flex w-[var(--admin-sidebar-width)] max-w-[80vw] -translate-x-full flex-col border-r border-white/20 bg-white/10 shadow-xl backdrop-blur-md transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : ""}`;

  return (
    <aside
      id="admin-sidebar"
      className={sidebarClasses}
      aria-label="Menú lateral de administración"
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-[var(--radius-sm)] p-2 text-white transition-colors hover:bg-white/10 hover:text-white lg:hidden border border-white/20"
        aria-controls="admin-sidebar"
        aria-expanded={isOpen}
        aria-label="Cerrar menú"
      >
        <span aria-hidden="true">×</span>
      </button>

      <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-6 pt-48" aria-label="Secciones de administración">
        {sidebarItems.map((item) => {
          if (item.href) {
            return (
              <SidebarActiveLink
                key={item.key}
                href={item.href}
                onClose={onClose}
                icon={item.icon}
              >
                <span>{item.label}</span>
              </SidebarActiveLink>
            );
          }
          return (
            <div
              key={item.key}
              className="group flex items-center gap-3 rounded-[var(--radius-md)] border border-transparent px-4 py-2.5 text-sm font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <span className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/20 px-4 pb-16 pt-4">
        <form action={logout}>
          <button
            type="submit"
            className="group flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-white/20 px-4 py-2.5 text-sm font-medium text-white/60 transition-all bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
          >
            <span className="h-5 w-5 shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
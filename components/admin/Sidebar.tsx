"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

const sidebarItems = [
  {
    key: "cabañas",
    label: "Cabañas",
    icon: "🏡",
    submenu: [
      { label: "Ver cabañas", href: "/admin/cabañas" },
    ],
  },
  {
    key: "propiedades",
    label: "Administrar propiedades",
    icon: "🏠",
    submenu: [
      { label: "Listado", href: "/admin/propiedades" },
      { label: "Nueva propiedad", href: "/admin/propiedades/new" },
    ],
  },
  {
    key: "precios",
    label: "Gestión de precios",
    icon: "💰",
    submenu: [
      { label: "Listado de precios", href: "/admin/precios" },
      { label: "Nuevo precio", href: "/admin/precios/new" },
    ],
  },
  {
    key: "reservas",
    label: "Ver reservas",
    icon: "📋",
    submenu: [
      { label: "Listado de reservas", href: "/admin/reservas" },
      { label: "Nueva reserva", href: "/admin/reservas/new" },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const handleItemClick = useCallback((key: string) => {
    setSelectedKey(key);
    onClose();
  }, [onClose]);

  const sidebarClasses = `fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-desert-sand/20 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`;

  return (
    <div className={sidebarClasses} aria-label="Menú lateral de administración">
      <div className="h-full p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold text-dark-pine">
            Panel Administración
          </h2>
          <button
            onClick={onClose}
            className="rounded-btn border border-desert-sand/40 px-3 py-1.5 text-sm text-dark-pine/70 transition-all hover:border-desert-sand"
            aria-controls="sidebar"
            aria-expanded={isOpen}
          >
            Cerrar menú
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          {sidebarItems.map((item) => (
            <div
              key={item.key}
              className={`
                group 
                ${selectedKey === item.key ? "bg-desert-sand/10 text-dark-pine" : "text-transparent"}
              `}
              onClick={() => handleItemClick(item.key)}
            >
              <button
                className="flex items-center gap-3 rounded-btn px-4 py-2.5 text-sm font-medium transition-all 
                  group-hover:text-dark-pine group-focus:text-dark-pine focus:outline-none focus:ring-2 focus:ring-desert-sand/40"
              >
                <span className="text-base">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
              {selectedKey === item.key && (
                <div className="mt-2 bg-white rounded-lg p-4 shadow-sm border border-desert-sand/20">
                  {item.submenu.map((sub) => (
                    <Link
                      key={sub.label}
                      href={sub.href}
                      className="display:block px-3 py-1.5 rounded-btn text-sm text-dark-pine/60 hover:bg-desert-sand/10 hover:text-dark-pine transition-all"
                      onClick={onClose}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
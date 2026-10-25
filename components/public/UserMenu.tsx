"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/app/login/actions";

interface UserMenuProps {
  esAdmin: boolean;
}

interface EstadoMenu {
  abierto: boolean;
  pathname: string;
}

const CLASE_DISPARADOR =
  "inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ink)]/70 transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-ink)] active:scale-[0.97]";

const CLASE_OPCION =
  "block w-full rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm text-[var(--color-ink)]/80 transition-colors hover:bg-[var(--color-clay-cream)] hover:text-[var(--color-ink)] focus:bg-[var(--color-clay-cream)] focus:text-[var(--color-ink)]";

export default function UserMenu({ esAdmin }: UserMenuProps) {
  const pathname = usePathname();
  const contenedorRef = useRef<HTMLDivElement>(null);
  const disparadorRef = useRef<HTMLButtonElement>(null);
  const [estado, setEstado] = useState<EstadoMenu>({
    abierto: false,
    pathname,
  });

  if (estado.pathname !== pathname) {
    setEstado({ abierto: false, pathname });
  }

  const cerrar = () => setEstado({ abierto: false, pathname });

  useEffect(() => {
    if (!estado.abierto) return;

    const alHacerClicFuera = (event: PointerEvent) => {
      if (!contenedorRef.current?.contains(event.target as Node)) {
        setEstado({ abierto: false, pathname });
      }
    };

    const alPresionarTecla = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEstado({ abierto: false, pathname });
        disparadorRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", alHacerClicFuera);
    document.addEventListener("keydown", alPresionarTecla);

    return () => {
      document.removeEventListener("pointerdown", alHacerClicFuera);
      document.removeEventListener("keydown", alPresionarTecla);
    };
  }, [estado.abierto, pathname]);

  return (
    <div ref={contenedorRef} className="relative">
      <button
        ref={disparadorRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={estado.abierto}
        onClick={() =>
          setEstado({ abierto: !estado.abierto, pathname })
        }
        className={CLASE_DISPARADOR}
      >
        Cuenta
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-3.5 w-3.5 transition-transform ${
            estado.abierto ? "rotate-180" : ""
          }`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {estado.abierto && (
        <div
          role="menu"
          aria-label="Opciones de cuenta"
          className="absolute right-0 top-full z-50 mt-2 min-w-44 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-lg animate-slide-down"
        >
          {esAdmin && (
            <Link
              href="/admin"
              role="menuitem"
              onClick={cerrar}
              className={`${CLASE_OPCION} font-medium`}
            >
              Admin
            </Link>
          )}
          <form action={logout} role="none">
            <button
              type="submit"
              role="menuitem"
              className={`${CLASE_OPCION} cursor-pointer`}
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

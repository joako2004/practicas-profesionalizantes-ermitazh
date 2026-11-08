import Link from "next/link";
import { COMPLEJO } from "@/lib/config";
import UserMenu from "./UserMenu";
import HeaderAutoOcultar from "./HeaderAutoOcultar";

const NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Cabañas", href: "/#cabanas" },
  { label: "Galería", href: "/galeria" },
  { label: "Nuestro Complejo", href: "/#bienvenidos" },
  { label: "Contacto", href: "/#contacto" },
];

export type Sesion = { email: string | null; esAdmin: boolean } | null;
export type HeaderContexto = "publico" | "admin";

const CLASE_VIDRIO =
  "border border-[var(--color-surface)]/50 bg-[var(--color-ink)]/30 shadow-md backdrop-blur-md backdrop-brightness-75";

const CLASE_ENLACE =
  "whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-[var(--color-surface)]/85 transition-colors hover:bg-[var(--color-surface)]/15 hover:text-[var(--color-surface)] active:scale-[0.97] lg:px-4 lg:text-[15px]";

const CLASE_BOTON_SESION =
  "whitespace-nowrap rounded-full border border-[var(--color-surface)]/40 px-4 py-2 text-sm font-medium text-[var(--color-surface)]/85 transition-all hover:bg-[var(--color-surface)]/15 hover:text-[var(--color-surface)] active:scale-[0.97] lg:px-5 lg:text-[15px]";

const CLASE_BOTON_PRIMARIO =
  "whitespace-nowrap rounded-full border border-[var(--color-accent)] bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white transition-all hover:bg-[var(--color-accent)]/80 hover:border-[var(--color-accent)]/80 active:scale-[0.97] lg:px-6 lg:text-[15px]";

function SesionControles({ sesion }: { sesion: Sesion }) {
  if (!sesion) {
    return (
      <Link href="/login" className={CLASE_BOTON_SESION}>
        Iniciar sesión
      </Link>
    );
  }

  return <UserMenu esAdmin={sesion.esAdmin} />;
}

export default function Header({
  sesion,
  contexto = "publico",
}: {
  sesion: Sesion;
  contexto?: HeaderContexto;
}) {
  return (
    <HeaderAutoOcultar
  activo={contexto === "publico" || contexto === "admin"}
  selectorScroll={contexto === "admin" ? "[data-admin-scroll]" : undefined}
>
      <nav
        aria-label="Navegación principal"
        className={`pointer-events-auto relative mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full px-5 py-2.5 md:px-6 md:py-3 lg:gap-6 lg:px-8 lg:py-3.5 ${CLASE_VIDRIO}`}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-surface)]/70 to-transparent lg:inset-x-14"
        />
        <Link
          href="/"
          className="whitespace-nowrap text-xl font-semibold tracking-wide text-[var(--color-surface)] lg:text-2xl"
        >
          {COMPLEJO.nombre}
        </Link>

        <div className="hidden items-center gap-1.5 md:flex lg:gap-2">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={CLASE_ENLACE}>
              {link.label}
            </Link>
          ))}
          {contexto === "publico" && !sesion?.esAdmin && (
            <Link href="/pre-reserva" className={CLASE_BOTON_PRIMARIO}>
              Reservar
            </Link>
          )}
          <SesionControles sesion={sesion} />
        </div>
        <div className="md:hidden">
          <SesionControles sesion={sesion} />
        </div>
      </nav>
    </HeaderAutoOcultar>
  );
}
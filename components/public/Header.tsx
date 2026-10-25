import Link from "next/link";
import { COMPLEJO } from "@/lib/config";
import UserMenu from "./UserMenu";

const NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Cabañas", href: "/#cabanas" },
  { label: "Galería", href: "/galeria" },
  { label: "Nuestro Complejo", href: "/#bienvenidos" },
];

export type Sesion = { email: string | null; esAdmin: boolean } | null;
export type HeaderContexto = "publico" | "admin";

const CLASE_BOTON_SESION =
  "rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ink)]/70 transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-ink)] active:scale-[0.97]";

const CLASE_BOTON_PRIMARIO =
  "rounded-[var(--radius-md)] border border-[var(--color-accent)] bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white transition-all hover:bg-[var(--color-accent)]/80 hover:border-[var(--color-accent)]/80 active:scale-[0.97]";

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-clay-cream)]/80 backdrop-blur-md border-b border-[var(--color-border)]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-xl font-semibold tracking-wide text-[var(--color-ink)]"
        >
          {COMPLEJO.nombre}
        </Link>

        <div className="hidden md:flex items-center gap-3 text-sm font-medium text-[var(--color-ink)]/70">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-ink)] active:scale-[0.97]"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/#contacto" className={CLASE_BOTON_SESION}>
            Contacto
          </Link>
          {contexto === "publico" && (
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
    </header>
  );
}

import Link from "next/link";
import { COMPLEJO } from "@/lib/config";
import { logout } from "@/app/login/actions";

const NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Cabañas", href: "/#cabanas" },
  { label: "Galería", href: "/galeria" },
  { label: "Nuestro Complejo", href: "/#bienvenidos" },
  { label: "Ubicación", href: "/#ubicacion" },
];

export type Sesion = { email: string | null; esAdmin: boolean } | null;

const CLASE_BOTON_SESION =
  "rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ink)]/70 transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-ink)] active:scale-[0.97]";

function SesionControles({ sesion }: { sesion: Sesion }) {
  if (!sesion) {
    return (
      <Link href="/login" className={CLASE_BOTON_SESION}>
        Iniciar sesión
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {sesion.esAdmin && (
        <Link href="/admin" className={CLASE_BOTON_SESION}>
          Panel
        </Link>
      )}
      <form action={logout}>
        <button type="submit" className={CLASE_BOTON_SESION}>
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}

export default function Header({ sesion }: { sesion: Sesion }) {
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
          {NAV_LINKS.map((link) =>
            link.href.startsWith("#") ? (
              <a
                key={link.href}
                href={link.href}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-ink)] active:scale-[0.97]"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-ink)] active:scale-[0.97]"
              >
                {link.label}
              </Link>
            )
          )}
          <a
            href="/#contacto"
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-5 py-2 text-sm font-medium text-[var(--color-ink)]/70 transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-ink)] active:scale-[0.97]"
          >
            Contacto
          </a>
          <Link
            href="/pre-reserva"
            className="rounded-[var(--radius-md)] border border-[var(--color-accent)] bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white transition-all hover:bg-[var(--color-accent)]/80 hover:border-[var(--color-accent)]/80 active:scale-[0.97]"
          >
            Reservar
          </Link>
          <SesionControles sesion={sesion} />
</div>
<div className="md:hidden">
  <SesionControles sesion={sesion} />
        </div>
      </nav>
    </header>
  );
}

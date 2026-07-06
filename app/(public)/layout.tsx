import Link from "next/link";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-champagne-pink/80 backdrop-blur-md border-b border-desert-sand/30">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight text-dark-pine"
          >
            Ermitazh
          </Link>
          <div className="flex items-center gap-8 text-sm font-medium text-dark-pine/70">
            <Link href="/" className="hover:text-dark-pine transition-colors">
              Cabañas
            </Link>
            <Link href="/" className="hover:text-dark-pine transition-colors">
              Servicios
            </Link>
            <Link href="/" className="hover:text-dark-pine transition-colors">
              Galería
            </Link>
            <Link
              href="/"
              className="rounded-btn bg-toasted-brown px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-toasted-brown/90 active:scale-[0.97]"
            >
              Reservar
            </Link>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-dark-pine text-white/70">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h3 className="mb-3 text-lg font-semibold text-white">
                Cabañas Ermitazh
              </h3>
              <p className="max-w-xs text-sm leading-relaxed text-white/60">
                Un refugio en medio de la naturaleza para desconectar y
                recargar energías.
              </p>
            </div>
            <div>
              <h3 className="mb-3 text-lg font-semibold text-white">
                Contacto
              </h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li>Mail - Falta</li>
                <li>+54 9 11 3878-5533</li>
                <li>San Rafael, Mendoza, Argentina</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-lg font-semibold text-white">
                Navegación
              </h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    Cabañas
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-white/10 pt-8 text-center text-xs text-white/40">
            &copy; {new Date().getFullYear()} Cabañas Ermitazh. Todos los
            derechos reservados.
          </div>
        </div>
      </footer>
    </>
  );
}

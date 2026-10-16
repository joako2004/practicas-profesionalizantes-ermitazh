import Header, { type Sesion } from "@/components/public/Header";
import Footer from "@/components/public/Footer";
import { obterPerfilActual } from "@/lib/auth/perfil";
import { prisma } from "@/lib/prisma";
import { IMAGENES_HERO_FALLBACK } from "@/lib/config";

async function obtenerImagenFondo(): Promise<string> {
  try {
    const imagen = await prisma.imagen.findFirst({
      where: { categoria: "hero", activa: true },
      orderBy: { orden: "asc" },
      select: { url: true },
    });
    return imagen?.url ?? IMAGENES_HERO_FALLBACK[0].url;
  } catch {
    return IMAGENES_HERO_FALLBACK[0].url;
  }
}

export default async function RegistroLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let sesion: Sesion = null;

  try {
    const actual = await obterPerfilActual();
    if (actual) {
      sesion = {
        email: actual.user.email,
        esAdmin: actual.perfil?.rol === "ADMIN",
      };
    }
  } catch {
    sesion = null;
  }

  const imagenFondo = await obtenerImagenFondo();

  return (
    <>
      <Header sesion={sesion} />
      <main className="relative flex min-h-[calc(100dvh_-_3rem)] flex-1 items-center justify-center overflow-hidden bg-[var(--color-bg)] px-6 pt-[135px] pb-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 scale-110 bg-cover bg-center blur-[22px]"
          style={{ backgroundImage: `url(${imagenFondo})` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--color-bg)]/35 via-[var(--color-bg)]/20 to-[var(--color-bg)]/45"
        />
        <div className="relative z-10 flex w-full justify-center">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}

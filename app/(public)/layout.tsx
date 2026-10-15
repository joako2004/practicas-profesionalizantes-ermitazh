import Header, { type Sesion } from "@/components/public/Header";
import Footer from "@/components/public/Footer";
import { obterPerfilActual } from "@/lib/auth/perfil";

export default async function PublicLayout({
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

  return (
    <>
      <Header sesion={sesion} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
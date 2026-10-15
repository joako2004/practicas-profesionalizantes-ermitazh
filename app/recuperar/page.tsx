import Link from "next/link";
import { solicitarRecuperacion } from "./actions";

type Props = {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
};

export default async function RecuperarPage({ searchParams }: Props) {
  const params = await searchParams;
  const enviado = params.enviado === "1";
  const error = typeof params.error === "string" ? params.error : null;
  const mensajeError =
    error === "email-invalido"
      ? "Ingresá un email válido."
      : error === "no-se-pudo-enviar"
        ? "No se pudo enviar el correo. Intentá de nuevo más tarde."
        : null;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-champagne-pink px-6">
      <div className="w-full max-w-sm">
        <div className="rounded-card bg-white p-8 shadow-sm ring-1 ring-desert-sand/20">
          <h1 className="mb-1 text-2xl font-semibold tracking-tight text-dark-pine">
            Recuperar contraseña
          </h1>

          {enviado ? (
            <p className="mt-3 text-sm text-dark-pine/70">
              Si el email corresponde a una cuenta, te enviamos un enlace para
              elegir una nueva contraseña. Revisá tu bandeja de entrada y la
              carpeta de spam. Abrí el enlace en este mismo navegador.
            </p>
          ) : (
            <>
              <p className="mb-8 text-sm text-dark-pine/50">
                Ingresá tu email y te enviamos un enlace para elegir una nueva
                contraseña.
              </p>

              <form action={solicitarRecuperacion} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium text-dark-pine"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="w-full rounded-btn border border-desert-sand/40 bg-white px-4 py-2.5 text-sm text-dark-pine placeholder:text-dark-pine/30 focus:border-toasted-brown focus:outline-none focus:ring-2 focus:ring-toasted-brown/10"
                    placeholder="tu@email.com"
                  />
                </div>

                {mensajeError && (
                  <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                    {mensajeError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full rounded-btn bg-toasted-brown px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-toasted-brown/90 active:scale-[0.97]"
                >
                  Enviar enlace
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-dark-pine/60">
            <Link
              href="/login"
              className="font-medium text-toasted-brown hover:underline"
            >
              Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

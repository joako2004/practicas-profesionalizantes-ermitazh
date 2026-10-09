"use client";

import { login } from "./actions";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-card border border-[var(--color-border)]/70 bg-[var(--color-clay-cream)]/80 p-8 shadow-xl backdrop-blur-md">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-dark-pine">
          Iniciar sesión
        </h1>
        <p className="mb-8 text-sm text-dark-pine/75">
          Panel de administración — Cabañas Ermitazh
        </p>

        <form action={login} className="space-y-5">
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
              className="min-h-11 w-full rounded-btn border border-desert-sand/60 bg-white/90 px-4 py-2.5 text-sm text-dark-pine placeholder:text-dark-pine/40 focus:border-toasted-brown focus:outline-none focus:ring-2 focus:ring-toasted-brown/20"
              placeholder="admin@ermitazh.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-dark-pine"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className="min-h-11 w-full rounded-btn border border-desert-sand/60 bg-white/90 px-4 py-2.5 pr-11 text-sm text-dark-pine placeholder:text-dark-pine/40 focus:border-toasted-brown focus:outline-none focus:ring-2 focus:ring-toasted-brown/20"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-1 text-dark-pine/55 transition-colors hover:text-dark-pine/85 focus:outline-none focus:ring-2 focus:ring-toasted-brown/30"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-md bg-red-50/95 px-3 py-2 text-sm text-red-600">
              Email o contraseña incorrectos.
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-btn bg-toasted-brown px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-toasted-brown/90 active:scale-[0.97]"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const heroImage =
    "https://coehmfszuwczfxfpumub.supabase.co/storage/v1/object/public/propiedades-fotos/exteriores_pileta_juegos/144.jpeg";

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-champagne-pink">
      <img
        aria-hidden="true"
        className="fixed inset-0 h-full w-full object-cover object-center"
        src={heroImage}
        alt=""
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-[var(--color-ink)]/65"
      />

      <header className="fixed inset-x-0 top-0 z-20 shrink-0 border-b border-[var(--color-border)] bg-[var(--color-clay-cream)]/80 backdrop-blur-md">
        <div className="flex h-[60px] items-center px-6">
          <a
            href="/"
            className="cursor-pointer text-xl font-semibold tracking-wide text-dark-pine transition-opacity hover:opacity-80"
          >
            Cabañas Ermitazh
          </a>
        </div>
      </header>

      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto pt-[60px]">
        <div className="flex min-h-[calc(100dvh-60px)] items-center justify-center px-4 py-8 sm:px-6">
          <div className="flex w-full justify-center -translate-y-[2%]">
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}

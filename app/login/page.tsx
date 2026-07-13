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
      <div className="rounded-card bg-white p-8 shadow-sm ring-1 ring-desert-sand/20">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-dark-pine">
          Iniciar sesión
        </h1>
        <p className="mb-8 text-sm text-dark-pine/50">
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
              className="w-full rounded-btn border border-desert-sand/40 bg-white px-4 py-2.5 text-sm text-dark-pine placeholder:text-dark-pine/30 focus:border-toasted-brown focus:outline-none focus:ring-2 focus:ring-toasted-brown/10"
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
                className="w-full rounded-btn border border-desert-sand/40 bg-white px-4 py-2.5 pr-11 text-sm text-dark-pine placeholder:text-dark-pine/30 focus:border-toasted-brown focus:outline-none focus:ring-2 focus:ring-toasted-brown/10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-pine/40 hover:text-dark-pine/70 transition-colors"
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
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
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
  return (
    <div className="flex min-h-dvh items-center justify-center bg-champagne-pink px-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

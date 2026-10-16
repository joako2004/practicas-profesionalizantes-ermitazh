"use client";

import Link from "next/link";
import { login } from "./actions";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const CLASE_INPUT =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink)]/35 transition-colors focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10";

const CLASE_LABEL = "mb-1.5 block text-sm font-medium text-[var(--color-ink)]";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const next = searchParams.get("next");
  const registroHref = next
    ? `/registro?next=${encodeURIComponent(next)}`
    : "/registro";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-[var(--radius-lg)] bg-white p-8 shadow-lg ring-1 ring-[var(--color-border)]">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
          Iniciar sesión
        </h1>
        <p className="mt-1.5 text-sm text-[var(--color-ink)]/55">
          Ingresá a tu cuenta — Cabañas Ermitazh
        </p>

        <form action={login} className="mt-8 space-y-5">
          <input type="hidden" name="next" value={next ?? ""} />
          <div>
            <label htmlFor="email" className={CLASE_LABEL}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={CLASE_INPUT}
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className={CLASE_LABEL}>
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className={`${CLASE_INPUT} pr-11`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink)]/40 transition-colors hover:text-[var(--color-ink)]/70"
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
            <p className="rounded-[var(--radius-md)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
              Email o contraseña incorrectos.
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--color-accent)]/90 active:scale-[0.97]"
          >
            Ingresar
          </button>
        </form>

        <div className="mt-6 border-t border-[var(--color-border)] pt-6">
          <p className="text-center text-sm text-[var(--color-ink)]/60">
            ¿No tenés cuenta?{" "}
            <Link
              href={registroHref}
              className="font-medium text-[var(--color-accent)] hover:underline"
            >
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { registrar } from "./actions";
import { COMPLEJO, IMAGENES_HERO_FALLBACK } from "@/lib/config";

const CLASE_INPUT =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink)]/35 transition-colors focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10";

const CLASE_LABEL = "mb-1.5 block text-sm font-medium text-[var(--color-ink)]";

const MENSAJES_ERROR: Record<string, string> = {
  "datos-invalidos":
    "Revisá los datos: nombre y apellido son obligatorios, el email debe ser válido y la contraseña debe tener entre 8 y 72 caracteres.",
  "no-se-pudo-crear":
    "No pudimos crear la cuenta. Si ya tenés una, iniciá sesión.",
};

function RegistroForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const next = searchParams.get("next") ?? "";
  const [showPassword, setShowPassword] = useState(false);
  const mensajeError = error
    ? (MENSAJES_ERROR[error] ?? MENSAJES_ERROR["no-se-pudo-crear"])
    : null;

  return (
    <div className="w-full max-w-md md:max-w-4xl">
      <div className="overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-lg ring-1 ring-[var(--color-border)] md:grid md:grid-cols-2">
        <div className="relative hidden md:block">
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${IMAGENES_HERO_FALLBACK[0].url})`,
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-[var(--color-ink)]/90 via-[var(--color-ink)]/45 to-[var(--color-ink)]/15"
          />
          <div className="relative flex h-full flex-col justify-end p-10 text-white">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/70">
              {COMPLEJO.tagline}
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {COMPLEJO.nombre}
            </p>
          </div>
        </div>

        <div className="p-8 md:p-10">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
            Crear cuenta
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-ink)]/55">
            Registrate para dejar tu reseña — Cabañas Ermitazh
          </p>

          <form action={registrar} className="mt-8 space-y-5">
            <input type="hidden" name="next" value={next} />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="nombre" className={CLASE_LABEL}>
                  Nombre
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  required
                  maxLength={80}
                  autoComplete="given-name"
                  className={CLASE_INPUT}
                />
              </div>
              <div>
                <label htmlFor="apellido" className={CLASE_LABEL}>
                  Apellido
                </label>
                <input
                  id="apellido"
                  name="apellido"
                  type="text"
                  required
                  maxLength={80}
                  autoComplete="family-name"
                  className={CLASE_INPUT}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className={CLASE_LABEL}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                className={CLASE_INPUT}
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="telefono" className={CLASE_LABEL}>
                Teléfono (opcional)
              </label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                maxLength={30}
                autoComplete="tel"
                className={CLASE_INPUT}
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
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  className={`${CLASE_INPUT} pr-11`}
                  placeholder="Mínimo 8 caracteres"
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

            {mensajeError && (
              <p className="rounded-[var(--radius-md)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
                {mensajeError}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--color-accent)]/90 active:scale-[0.97]"
            >
              Crear cuenta
            </button>
          </form>

          <div className="mt-6 border-t border-[var(--color-border)] pt-6">
            <p className="text-center text-sm text-[var(--color-ink)]/60">
              ¿Ya tenés cuenta?{" "}
              <Link
                href="/login"
                className="font-medium text-[var(--color-accent)] hover:underline"
              >
                Iniciá sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <Suspense fallback={null}>
      <RegistroForm />
    </Suspense>
  );
}

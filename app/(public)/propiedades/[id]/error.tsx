"use client";

import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PropertyDetailError({ error, reset }: ErrorProps) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 text-center">
      <h1 className="text-3xl font-bold text-[var(--color-ink)]">
        Algo salió mal
      </h1>
      <p className="mt-4 text-[var(--color-ink)]/70">
        No pudimos cargar los detalles de la cabaña. Por favor intenta más tarde.
      </p>
      {error.message && (
        <p className="mt-2 text-sm text-[var(--color-ink)]/50">
          {error.message}
        </p>
      )}
      <div className="mt-8 flex flex-col gap-3 justify-center md:flex-row">
        <button
          onClick={reset}
          className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-6 py-3 font-medium text-white transition-all hover:bg-[var(--color-accent)]/90"
        >
          Intentar de nuevo
        </button>
        <Link
          href="/#cabanas"
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-6 py-3 font-medium text-[var(--color-ink)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          Volver al listado
        </Link>
      </div>
    </div>
  );
}

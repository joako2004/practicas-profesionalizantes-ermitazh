"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { crearResena } from "@/lib/actions/resenas";

interface ResenaFormProps {
  propiedadId: string;
  autenticado: boolean;
}

const TEXTO_MIN = 10;
const TEXTO_MAX = 1000;

export default function ResenaForm({
  propiedadId,
  autenticado,
}: ResenaFormProps) {
  const [puntuacion, setPuntuacion] = useState(0);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviada, setEnviada] = useState(false);
  const [isPending, startTransition] = useTransition();

  const destino = encodeURIComponent(`/cabanas/${propiedadId}`);
  const textoValido = texto.trim().length >= TEXTO_MIN;

  const handleEnviar = () => {
    setError(null);

    startTransition(async () => {
      const res = await crearResena(propiedadId, puntuacion, texto);
      if (res.success) {
        setEnviada(true);
      } else {
        setError(res.error ?? "No pudimos guardar tu reseña.");
      }
    });
  };

  if (!autenticado) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6">
        <h2 className="mb-1.5 text-lg font-semibold text-[var(--color-ink)]">
          Dejá tu reseña
        </h2>
        <p className="text-sm text-[var(--color-ink)]/70">
          <Link
            href={`/login?next=${destino}`}
            className="font-medium text-[var(--color-accent)] hover:underline"
          >
            Iniciá sesión
          </Link>{" "}
          o{" "}
          <Link
            href={`/registro?next=${destino}`}
            className="font-medium text-[var(--color-accent)] hover:underline"
          >
            creá una cuenta
          </Link>{" "}
          para dejar tu reseña.
        </p>
      </div>
    );
  }

  if (enviada) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6">
        <h2 className="mb-1.5 text-lg font-semibold text-[var(--color-ink)]">
          ¡Gracias!
        </h2>
        <p className="text-sm text-[var(--color-ink)]/70">
          Tu reseña se publicará cuando sea revisada.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-[var(--color-ink)]">
        Dejá tu reseña
      </h2>

      <div className="mb-4">
        <p className="mb-1 text-xs font-medium text-[var(--color-ink)]/60">
          Puntuación
        </p>
        <div className="flex gap-1" role="group" aria-label="Puntuación">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={puntuacion === n}
              aria-label={n + (n === 1 ? " estrella" : " estrellas")}
              onClick={() => setPuntuacion(n)}
              className={`
                text-2xl transition-colors
                ${n <= puntuacion
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-border)] hover:text-[var(--color-accent)]/60"}
              `}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <label htmlFor="resena-texto" className="mb-1 block text-xs font-medium text-[var(--color-ink)]/60">
        Tu experiencia
      </label>
      <textarea
        id="resena-texto"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        maxLength={TEXTO_MAX}
        rows={5}
        className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-accent)]"
        placeholder="Contanos cómo fue tu estadía (mínimo 10 caracteres)"
      />
      <p className="mt-1 text-right text-xs text-[var(--color-ink)]/50">
        {texto.length} / {TEXTO_MAX}
      </p>

      {error && (
        <p className="mt-3 text-sm text-[var(--color-danger)]">{error}</p>
      )}

      <button
        type="button"
        onClick={handleEnviar}
        disabled={isPending || puntuacion < 1 || !textoValido}
        className="mt-4 w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[var(--color-accent)]/90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] sm:w-auto"
      >
        {isPending ? "Enviando..." : "Enviar reseña"}
      </button>
    </div>
  );
}
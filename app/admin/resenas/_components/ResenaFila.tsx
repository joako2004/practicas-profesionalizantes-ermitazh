"use client";

import { useState, useTransition } from "react";
import {
  aprobarResena,
  despublicarResena,
  rechazarResena,
} from "@/lib/actions/resenas-admin";

interface ResenaFilaProps {
  id: string;
  autor: string;
  texto: string;
  puntuacion: number;
  publicada: boolean;
  cabana: string;
  fecha: string;
}

type Accion = (
  resenaId: string
) => Promise<{ success: boolean; error?: string }>;

export default function ResenaFila({
  id,
  autor,
  texto,
  puntuacion,
  publicada,
  cabana,
  fecha,
}: ResenaFilaProps) {
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const ejecutar = (accion: Accion) => {
    setError(null);
    startTransition(async () => {
      const res = await accion(id);
      if (!res.success) {
        setError(res.error || "Error al actualizar la reseña");
      }
      setConfirmando(false);
    });
  };

  return (
    <div className="rounded-lg border border-desert-sand/20 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-dark-pine">{cabana}</p>
          <p className="mt-0.5 text-sm text-dark-pine/60">
            {autor} · {fecha}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex gap-0.5"
            role="img"
            aria-label={`${puntuacion} de 5 estrellas`}
          >
            {Array.from({ length: 5 }).map((_, j) => (
              <span
                key={j}
                className={`text-lg ${
                  j < puntuacion ? "text-toasted-brown" : "text-desert-sand/40"
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
              publicada
                ? "border-success-border bg-success-bg text-success"
                : "border-warning-border bg-warning-bg text-warning"
            }`}
          >
            {publicada ? "Publicada" : "Pendiente"}
          </span>
        </div>
      </div>

      <p className="mt-4 whitespace-pre-line break-words text-sm leading-relaxed text-dark-pine/80">
        {texto}
      </p>

      {error && <p className="mt-4 text-sm text-danger">⚠ {error}</p>}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
        {confirmando ? (
          <>
            <span className="text-sm text-dark-pine/70">
              ¿Eliminar esta reseña?
            </span>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              disabled={isPending}
              className="rounded-btn border border-desert-sand/40 px-4 py-2 text-sm font-medium text-dark-pine/70 transition-all hover:border-desert-sand hover:text-dark-pine disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => ejecutar(rechazarResena)}
              disabled={isPending}
              className="rounded-btn bg-danger px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Eliminando..." : "Eliminar"}
            </button>
          </>
        ) : (
          <>
            {publicada ? (
              <button
                type="button"
                onClick={() => ejecutar(despublicarResena)}
                disabled={isPending}
                className="rounded-btn border border-desert-sand/40 px-4 py-2 text-sm font-medium text-dark-pine/70 transition-all hover:border-desert-sand hover:text-dark-pine disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Guardando..." : "Despublicar"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => ejecutar(aprobarResena)}
                disabled={isPending}
                className="rounded-btn bg-toasted-brown px-4 py-2 text-sm font-medium text-white transition-all hover:bg-toasted-brown/90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Guardando..." : "Aprobar"}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setError(null);
                setConfirmando(true);
              }}
              disabled={isPending}
              className="rounded-btn border border-danger px-4 py-2 text-sm font-medium text-danger transition-all hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50"
            >
              Rechazar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

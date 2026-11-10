"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { updatePropiedadAtributo } from "@/lib/actions/propiedades";

interface InterruptorActivaProps {
  propiedadId: string;
  nombre: string;
  activa: boolean;
}

export default function InterruptorActiva({
  propiedadId,
  nombre,
  activa,
}: InterruptorActivaProps) {
  const idTitulo = useId();
  const idEtiqueta = useId();
  const idAyuda = useId();
  const idDialogo = useId();

  const [confirmandoOcultar, setConfirmandoOcultar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!confirmandoOcultar) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [confirmandoOcultar]);

  useEffect(() => {
    if (!confirmandoOcultar) return;

    const alPresionarTecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape" && !isPending) {
        setConfirmandoOcultar(false);
      }
    };

    document.addEventListener("keydown", alPresionarTecla);
    return () => document.removeEventListener("keydown", alPresionarTecla);
  }, [confirmandoOcultar, isPending]);

  const guardar = (nuevoValor: boolean) => {
    setError(null);
    setConfirmacion(null);

    startTransition(async () => {
      const resultado = await updatePropiedadAtributo(
        propiedadId,
        "activa",
        nuevoValor
      );

      if (resultado.success) {
        setConfirmandoOcultar(false);
        setConfirmacion(
          nuevoValor
            ? "La cabaña se publicó en el sitio."
            : "La cabaña se ocultó del sitio."
        );
      } else {
        setConfirmandoOcultar(false);
        setError(resultado.error ?? "No se pudo cambiar la publicación.");
      }
    });
  };

  const manejarInterruptor = () => {
    if (isPending) return;

    setError(null);
    setConfirmacion(null);

    if (activa) {
      setConfirmandoOcultar(true);
      return;
    }

    guardar(true);
  };

  const cancelarOcultar = () => {
    if (isPending) return;
    setConfirmandoOcultar(false);
  };

  return (
    <>
      <section
        aria-labelledby={idTitulo}
        className="rounded-md border border-[color:var(--prop-panel-border)] bg-[color:var(--prop-panel-bg)] p-4 sm:p-5"
      >
        <h4
          id={idTitulo}
          className="flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-dark-pine"
        >
          <span
            aria-hidden="true"
            className="h-4 w-[2px] shrink-0 rounded-full bg-dark-pine"
          />
          Publicación
        </h4>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span
              id={idEtiqueta}
              className="block text-sm font-medium text-dark-pine"
            >
              Publicada en el sitio
            </span>
            <p
              id={idAyuda}
              className="mt-1 text-xs leading-relaxed text-muted-dark"
            >
              {activa
                ? "La cabaña es visible en el inicio, en la pre-reserva y en el calendario de disponibilidad."
                : "La cabaña está oculta: no aparece en el inicio, en la pre-reserva ni en el calendario de disponibilidad. Su ficha sigue accesible por enlace directo, sin el botón de pre-reserva; la calculadora de precios queda visible pero no carga la disponibilidad."}
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={activa}
            aria-labelledby={idEtiqueta}
            aria-describedby={idAyuda}
            aria-busy={isPending}
            disabled={isPending}
            onClick={manejarInterruptor}
            className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-pine focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 ${
              activa
                ? "border-dark-pine bg-dark-pine"
                : "border-[color:var(--prop-field-border-empty)] bg-[color:var(--prop-field-bg-empty)]"
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                activa ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-sm border border-[color:var(--color-danger-border)] bg-danger-bg px-3 py-2 text-sm text-danger"
          >
            ⚠ {error}
          </p>
        )}

        {confirmacion && (
          <p role="status" className="mt-3 text-sm text-success">
            {confirmacion}
          </p>
        )}
      </section>

      {confirmandoOcultar && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={idDialogo}
          onClick={isPending ? undefined : cancelarOcultar}
          className="fixed inset-0 z-50 flex items-center justify-center bg-dark-pine/50 p-4 animate-fade-in"
        >
          <div
            onClick={(evento) => evento.stopPropagation()}
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl animate-slide-up"
          >
            <h3 id={idDialogo} className="text-lg font-semibold text-dark-pine">
              ¿Ocultar {nombre} del sitio?
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-dark-pine/70">
              La cabaña dejará de aparecer en el inicio, en la pre-reserva y en el
              calendario de disponibilidad. Las reservas ya hechas no se modifican.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelarOcultar}
                disabled={isPending}
                className="rounded-md border border-desert-sand/20 bg-white/5 px-4 py-2 text-sm font-medium text-dark-pine/70 backdrop-blur-md transition-all hover:border-desert-sand hover:text-dark-pine disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => guardar(false)}
                disabled={isPending}
                className="rounded-md bg-dark-pine px-4 py-2 text-sm font-medium text-white transition-all hover:bg-dark-pine/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Ocultando..." : "Ocultar cabaña"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

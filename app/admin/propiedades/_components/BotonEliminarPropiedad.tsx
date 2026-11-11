"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";

import { eliminarPropiedadCompleta } from "@/lib/actions/eliminar-propiedad";

interface BotonEliminarPropiedadProps {
  propiedadId: string;
  nombre: string;
  cantidadFotos?: number;
}

interface ConfirmDialogEliminarProps {
  nombre: string;
  cantidadFotos: number;
  idTitulo: string;
  idDescripcion: string;
  error: string | null;
  eliminando: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

function ConfirmDialogEliminar({
  nombre,
  cantidadFotos,
  idTitulo,
  idDescripcion,
  error,
  eliminando,
  onConfirmar,
  onCancelar,
}: ConfirmDialogEliminarProps) {
  const refCancelar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    refCancelar.current?.focus();
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={idTitulo}
      aria-describedby={idDescripcion}
      onClick={eliminando ? undefined : onCancelar}
      className="fixed inset-0 z-50 flex items-center justify-center bg-dark-pine/50 p-4 animate-fade-in"
    >
      <div
        onClick={(evento) => evento.stopPropagation()}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl animate-slide-up"
      >
        <h3 id={idTitulo} className="text-lg font-semibold text-dark-pine">
          ¿Eliminar {nombre} definitivamente?
        </h3>
        <p
          id={idDescripcion}
          className="mt-3 text-sm leading-relaxed text-dark-pine/70"
        >
          Se borrarán la cabaña y sus fotos propias. Esta acción no se puede
          deshacer. Solo se puede eliminar si no tiene reservas ni reseñas
          asociadas.
        </p>

        {cantidadFotos > 0 && (
          <p className="mt-4 rounded-sm border border-[color:var(--color-danger-border)] bg-danger-bg px-3 py-2 text-sm text-danger">
            {`Esta cabaña tiene ${cantidadFotos} ${cantidadFotos === 1 ? "foto" : "fotos"}. También se borrarán del almacenamiento las fotos que no use otra cabaña.`}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-sm border border-[color:var(--color-danger-border)] bg-danger-bg px-3 py-2 text-sm text-danger"
          >
            ⚠ {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={refCancelar}
            type="button"
            onClick={onCancelar}
            disabled={eliminando}
            className="rounded-md border border-desert-sand/20 bg-white/5 px-4 py-2 text-sm font-medium text-dark-pine/70 backdrop-blur-md transition-all hover:border-desert-sand hover:text-dark-pine disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={eliminando}
            className="rounded-md bg-danger px-4 py-2 text-sm font-medium text-white transition-all hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {eliminando ? "Eliminando..." : "Eliminar cabaña"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BotonEliminarPropiedad({
  propiedadId,
  nombre,
  cantidadFotos = 0,
}: BotonEliminarPropiedadProps) {
  const idTitulo = useId();
  const idDescripcion = useId();
  const idDialogo = useId();

  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!confirmando) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [confirmando]);

  useEffect(() => {
    if (!confirmando) return;

    const alPresionarTecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape" && !isPending) {
        setConfirmando(false);
      }
    };

    document.addEventListener("keydown", alPresionarTecla);
    return () => document.removeEventListener("keydown", alPresionarTecla);
  }, [confirmando, isPending]);

  const abrirConfirmacion = () => {
    if (isPending) return;
    setError(null);
    setConfirmando(true);
  };

  const cancelar = () => {
    if (isPending) return;
    setConfirmando(false);
    setError(null);
  };

  const confirmar = () => {
    setError(null);

    startTransition(async () => {
      const resultado = await eliminarPropiedadCompleta(propiedadId);

      if (resultado.success) {
        // La tarjeta desaparece cuando la acción revalida la lista.
        setConfirmando(false);
      } else {
        setError(resultado.error);
      }
    });
  };

  return (
    <>
      <section
        aria-labelledby={idTitulo}
        className="rounded-md border border-[color:var(--color-danger-border)] bg-danger-bg/40 p-4 sm:p-5"
      >
        <h4
          id={idTitulo}
          className="flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-dark-pine"
        >
          <span
            aria-hidden="true"
            className="h-4 w-[2px] shrink-0 rounded-full bg-danger"
          />
          Eliminar cabaña
        </h4>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-muted-dark">
            Borra la cabaña y sus fotos propias de forma definitiva. Solo es
            posible si no tiene reservas ni reseñas asociadas; si las tiene,
            desactivala para conservar el historial.
          </p>
          <button
            type="button"
            onClick={abrirConfirmacion}
            aria-haspopup="dialog"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-md border border-[color:var(--color-danger-border)] bg-white px-4 py-2 text-sm font-medium text-danger transition-all hover:bg-danger-bg active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger sm:self-auto"
          >
            Eliminar cabaña
          </button>
        </div>
      </section>

      {confirmando && (
        <ConfirmDialogEliminar
          nombre={nombre}
          cantidadFotos={cantidadFotos}
          idTitulo={idDialogo}
          idDescripcion={idDescripcion}
          error={error}
          eliminando={isPending}
          onConfirmar={confirmar}
          onCancelar={cancelar}
        />
      )}
    </>
  );
}

"use client";

import { useEffect } from "react";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  atributo: string;
  valorActual: string;
  nuevoValor: string;
  disabled?: boolean;
}

export default function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  atributo,
  valorActual,
  nuevoValor,
  disabled = false,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  const capitalizar = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-pine/50 animate-fade-in" onClick={disabled ? undefined : onCancel} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <h3 id="confirm-title" className="text-lg font-semibold text-dark-pine">
          ¿Desea modificar este atributo?
        </h3>

        <div className="mt-4 space-y-3 text-sm">
          <div className="rounded-lg bg-desert-sand/10 p-3">
            <p className="font-medium text-dark-pine/70">{capitalizar(atributo)}</p>
            <div className="mt-2 flex items-center gap-2 text-dark-pine/60">
              <span className="flex-1 text-right font-mono">{valorActual}</span>
              <span className="text-toasted-brown">→</span>
              <span className="flex-1 font-mono font-medium">{nuevoValor}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={disabled}
            className="rounded-btn border border-desert-sand/40 px-4 py-2 text-sm font-medium text-dark-pine/70 transition-all hover:border-desert-sand hover:text-dark-pine disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className="rounded-btn bg-toasted-brown px-4 py-2 text-sm font-medium text-white transition-all hover:bg-toasted-brown/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {disabled ? "Guardando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
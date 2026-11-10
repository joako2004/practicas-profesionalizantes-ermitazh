"use client";

import { useState } from "react";

import { LIMITES_PROPIEDAD } from "@/lib/propiedades/validar-nueva";

interface CampoServiciosProps {
  id: string;
  valor: string[];
  onChange: (v: string[]) => void;
  error?: string;
}

// Misma comparación que usa la validación del servidor: sin distinguir
// mayúsculas ni tildes, para no cargar dos veces el mismo servicio.
function normalizarServicio(texto: string): string {
  return texto
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const CLASE_CAMPO =
  "min-h-11 w-full rounded-sm border px-3 text-[15px] font-medium transition-colors placeholder:font-normal placeholder:text-muted-dark/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white sm:min-h-10";

export default function CampoServicios({
  id,
  valor,
  onChange,
  error,
}: CampoServiciosProps) {
  const [texto, setTexto] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);

  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const idAviso = `${id}-aviso`;

  const contadorId = `${id}-contador`;
  const maximoAlcanzado = valor.length >= LIMITES_PROPIEDAD.serviciosMax;

  const descritoPor = [idAyuda, contadorId, error ? idError : null, aviso ? idAviso : null]
    .filter((item): item is string => item !== null)
    .join(" ");

  function agregar(): void {
    const limpio = texto.trim();
    if (limpio.length === 0) return;

    if (maximoAlcanzado) {
      setAviso(`Máximo ${LIMITES_PROPIEDAD.serviciosMax} servicios`);
      return;
    }

    const clave = normalizarServicio(limpio);
    if (valor.some((servicio) => normalizarServicio(servicio) === clave)) {
      setAviso("Ya lo agregaste");
      return;
    }

    onChange([...valor, limpio]);
    setTexto("");
    setAviso(null);
  }

  function quitar(servicio: string): void {
    onChange(valor.filter((item) => item !== servicio));
    setAviso(null);
  }

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={id}
          type="text"
          value={texto}
          onChange={(evento) => {
            setTexto(evento.target.value);
            if (aviso) setAviso(null);
          }}
          onKeyDown={(evento) => {
            if (evento.key === "Enter") {
              evento.preventDefault();
              agregar();
            }
          }}
          maxLength={LIMITES_PROPIEDAD.servicioMax}
          placeholder="Ej.: WiFi"
          aria-invalid={error ? true : undefined}
          aria-describedby={descritoPor}
          className={`${CLASE_CAMPO} ${
            error
              ? "border-danger bg-danger-bg text-danger focus:ring-danger"
              : "border-[color:var(--form-field-border)] bg-white text-dark-pine hover:border-[color:var(--form-field-border-hover)] focus:border-dark-pine focus:ring-dark-pine"
          }`}
        />
        <button
          type="button"
          onClick={agregar}
          disabled={texto.trim().length === 0}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-sm border border-[color:var(--form-field-border)] bg-white px-4 text-sm font-semibold text-dark-pine transition-colors hover:border-[color:var(--form-field-border-hover)] hover:bg-[color:var(--form-field-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-pine focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:border-[color:var(--form-disabled-border)] disabled:bg-[color:var(--form-disabled-bg)] disabled:text-muted-dark sm:min-h-10"
        >
          Agregar
        </button>
      </div>

      <div className="mt-1.5 flex items-start justify-between gap-3">
        <p id={idAyuda} className="text-xs leading-relaxed text-muted-dark">
          Opcional. Ejemplos: WiFi, parrilla, aire acondicionado.
        </p>
        <span
          id={contadorId}
          className={`shrink-0 text-xs tabular-nums ${
            maximoAlcanzado ? "font-medium text-[#573c00]" : "text-muted-dark"
          }`}
        >
          {valor.length}/{LIMITES_PROPIEDAD.serviciosMax}
        </span>
      </div>

      {aviso ? (
        <p id={idAviso} role="status" className="mt-1.5 text-xs font-medium text-[#573c00]">
          {aviso}
        </p>
      ) : null}

      {error ? (
        <p id={idError} role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}

      {valor.length > 0 ? (
        <ul aria-label="Servicios agregados" className="mt-3 flex flex-wrap gap-2">
          {valor.map((servicio) => (
            <li
              key={servicio}
              className="inline-flex items-center gap-1 rounded-full border border-desert-sand/60 bg-white py-0.5 pl-3 pr-1 text-xs font-medium text-dark-pine"
            >
              <span>{servicio}</span>
              <button
                type="button"
                onClick={() => quitar(servicio)}
                aria-label={`Quitar ${servicio}`}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-dark transition-colors hover:bg-danger-bg hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-pine focus-visible:ring-offset-1"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

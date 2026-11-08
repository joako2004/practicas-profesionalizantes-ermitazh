"use client";

import { useState, useRef, useEffect } from "react";

interface AtributoEditableProps {
  propiedadId: string;
  atributo: string;
  tipo: "text" | "number" | "decimal" | "boolean" | "array" | "usd";
  valorActual: unknown;
  onEditRequest: (atributo: string, nuevoValor: unknown) => void;
  /** Nombre legible del campo para el aria-label del botón de edición. */
  etiqueta?: string;
  /** Usa un recuadro más alto para valores de varias líneas (Descripción). */
  multilinea?: boolean;
}

export default function AtributoEditable({
  propiedadId,
  atributo,
  tipo,
  valorActual,
  onEditRequest,
  etiqueta,
  multilinea = false,
}: AtributoEditableProps) {
  const [editando, setEditando] = useState(false);
  const [valorEditado, setValorEditado] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const formatoParaInput = (valor: unknown, tipo: string): string => {
    if (valor === null || valor === undefined) return "";
    if (tipo === "usd") return Number(valor).toFixed(2);
    if (tipo === "array") return (valor as string[]).join("\n");
    if (tipo === "boolean") return valor ? "true" : "false";
    if (tipo === "decimal") return Number(valor).toFixed(2);
    return String(valor);
  };

  const parsearValor = (valor: string, tipo: string): unknown => {
    const trimmed = valor.trim().replace(",", ".");
    if (!trimmed) return null;

    switch (tipo) {
      case "number":
        const num = parseFloat(trimmed);
        return isNaN(num) ? null : Number.isInteger(num) ? num : Math.round(num);
      case "decimal":
        const dec = parseFloat(trimmed);
        return isNaN(dec) ? null : Math.round(dec * 100) / 100;
      case "usd":
        return /^\d+(\.\d{1,2})?$/.test(trimmed) ? Number(trimmed) : trimmed;
      case "boolean":
        return trimmed.toLowerCase() === "true";
      case "array":
        return trimmed.split("\n").map((s) => s.trim()).filter(Boolean);
      default:
        return trimmed;
    }
  };

  // Evita abrir el diálogo (y vaciar por accidente) si no hubo cambio.
  const esSinCambioUsd = (parseado: unknown, actual: unknown): boolean => {
    if (parseado === null || parseado === undefined) {
      return actual === null || actual === undefined;
    }
    return typeof actual === "number" && Number(actual) === parseado;
  };

  const validar = (valor: unknown, tipo: string, atributo?: string): string | null => {
    if (tipo === "usd") {
      if (valor === null) return null;
      if (typeof valor !== "number" || !Number.isFinite(valor)) {
        return "Ingresá un número positivo con hasta 2 decimales (por ejemplo 145 o 145,50)";
      }
      if (valor <= 0) {
        return "Debe ser mayor a 0 (para dejar sin precio, vaciá el campo)";
      }
      if (valor > 1000000) {
        return "El máximo es US$ 1.000.000";
      }
      return null;
    }

    if (valor === null || valor === "") {
      return "Este campo es obligatorio";
    }

    switch (tipo) {
      case "number": {
        const val = Number(valor);
        if (!Number.isFinite(val)) {
          return "Debe ser un número válido";
        }
        if (atributo && atributo.includes("promo")) {
          if (val < 0 || val > 100) {
            return "El porcentaje debe estar entre 0 y 100";
          }
        } else {
          if (val < 0) {
            return "Debe ser un número mayor o igual a 0";
          }
        }
        break;
      }
      case "decimal": {
        const val = Number(valor);
        if (!Number.isFinite(val)) {
          return "Debe ser un número válido";
        }
        if (val < 0) {
          return "Debe ser un número mayor o igual a 0";
        }
        break;
      }
      case "text":
        if (typeof valor === "string" && valor.trim() === "") {
          return "No puede estar vacío";
        }
        break;
      case "array":
        if (Array.isArray(valor) && valor.length === 0) {
          return "Debe tener al menos un servicio";
        }
        break;
    }
    return null;
  };

  const manejarBlur = () => {
    if (!editando) return;
    const parseado = parsearValor(valorEditado, tipo);
    const errorValidacion = validar(parseado, tipo, atributo);
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }
    if (tipo === "usd" && esSinCambioUsd(parseado, valorActual)) {
      setEditando(false);
      setError("");
      return;
    }
    onEditRequest(atributo, parseado);
    setEditando(false);
  };

  const manejarKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tipo !== "array") {
      e.preventDefault();
      const parseado = parsearValor(valorEditado, tipo);
      const errorValidacion = validar(parseado, tipo, atributo);
      if (!errorValidacion) {
        if (tipo === "usd" && esSinCambioUsd(parseado, valorActual)) {
          setEditando(false);
          setError("");
          return;
        }
        onEditRequest(atributo, parseado);
        setEditando(false);
      } else {
        setError(errorValidacion);
      }
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setValorEditado(formatoParaInput(valorActual, tipo));
      setEditando(false);
      setError("");
    }
  };

  const manejarClick = () => {
    if (!editando) {
      if (tipo === "usd") setValorEditado(formatoParaInput(valorActual, tipo));
      setEditando(true);
    }
  };

  const manejarChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValorEditado(e.target.value);
    if (error) setError("");
  };

  const formatearMostrar = (valor: unknown): string => {
    if (tipo === "usd") {
      if (valor === null || valor === undefined) return "Sin precio";
      return `US$ ${Number(valor).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (valor === null || valor === undefined) return "—";
    if (tipo === "decimal") return `$${Number(valor).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
    if (tipo === "array") return (valor as string[]).join(", ") || "—";
    if (tipo === "boolean") return valor ? "Sí" : "No";
    return String(valor);
  };

  if (editando) {
    const inputType = "text";
    const alturaCampo = multilinea || tipo === "array" ? "h-24" : "h-11";
    const vacio = tipo === "usd" && valorEditado.trim() === "";
    const clasesCampo = `w-full ${alturaCampo} rounded-sm border px-3 text-[15px] font-medium transition-colors placeholder:text-muted-dark focus:outline-none focus:ring-2 focus:ring-dark-pine focus:ring-offset-2 focus:ring-offset-white ${
      error
        ? "border-danger bg-danger-bg text-danger focus:ring-danger"
        : vacio
          ? "border-dashed border-dark-pine bg-desert-sand/10 text-dark-pine"
          : "border-dark-pine bg-white text-dark-pine"
    }`;

    return (
      <div className="w-full">
        {tipo === "array" ? (
          <textarea
            ref={textareaRef}
            value={valorEditado}
            onChange={manejarChange}
            onBlur={manejarBlur}
            onKeyDown={manejarKeyDown}
            onClick={(e) => e.stopPropagation()}
            className={`${clasesCampo} resize-none`}
            aria-label={etiqueta ?? atributo}
            placeholder="Un servicio por línea"
            rows={3}
          />
        ) : (
          <input
            ref={inputRef}
            type={inputType}
            value={valorEditado}
            onChange={manejarChange}
            onBlur={manejarBlur}
            onKeyDown={manejarKeyDown}
            onClick={(e) => e.stopPropagation()}
            className={clasesCampo}
            aria-label={etiqueta ?? atributo}
            placeholder={tipo === "usd" ? "US$ (vacío = sin precio)" : `Nuevo ${atributo}`}
            inputMode={tipo === "usd" ? "decimal" : undefined}
            step={tipo === "decimal" ? "0.01" : undefined}
            min={tipo === "number" ? "0" : tipo === "decimal" ? "0" : undefined}
          />
        )}
        {error && <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>}
      </div>
    );
  }

  const sinPrecio = tipo === "usd" && (valorActual === null || valorActual === undefined);
  const alturaCampo = multilinea ? "h-24" : "h-11";
  const clasesEstado = sinPrecio
    ? "border-dashed border-[color:var(--prop-field-border-empty)] bg-[color:var(--prop-field-bg-empty)] hover:border-[color:var(--prop-field-border-hover)] hover:bg-[color:var(--prop-field-bg-empty-hover)]"
    : "border-[color:var(--prop-field-border)] bg-white hover:border-[color:var(--prop-field-border-hover)] hover:bg-[color:var(--prop-field-hover-bg)]";

  return (
    <button
      type="button"
      onClick={manejarClick}
      aria-label={`Editar ${etiqueta ?? atributo}`}
      className={`group flex ${alturaCampo} w-full cursor-pointer items-center gap-2 rounded-sm border px-3 text-left text-[15px] font-medium text-dark-pine transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-pine focus-visible:ring-offset-2 focus-visible:ring-offset-white ${clasesEstado}`}
    >
      <span
        className={`min-w-0 flex-1 ${
          multilinea ? "line-clamp-3 break-words" : "truncate"
        } ${sinPrecio ? "italic text-muted-dark" : ""}`}
      >
        {formatearMostrar(valorActual)}
      </span>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5 flex-shrink-0 text-muted-dark/80 transition-opacity opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-visible:opacity-100"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    </button>
  );
}
"use client";

import { useState, useRef, useEffect } from "react";

interface AtributoEditableProps {
  propiedadId: string;
  atributo: string;
  tipo: "text" | "number" | "decimal" | "boolean" | "array";
  valorActual: unknown;
  onEditRequest: (atributo: string, nuevoValor: unknown) => void;
}

export default function AtributoEditable({
  propiedadId,
  atributo,
  tipo,
  valorActual,
  onEditRequest,
}: AtributoEditableProps) {
  const [editando, setEditando] = useState(false);
  const [valorEditado, setValorEditado] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const formatoParaInput = (valor: unknown, tipo: string): string => {
    if (valor === null || valor === undefined) return "";
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
      case "boolean":
        return trimmed.toLowerCase() === "true";
      case "array":
        return trimmed.split("\n").map((s) => s.trim()).filter(Boolean);
      default:
        return trimmed;
    }
  };

  const validar = (valor: unknown, tipo: string, atributo?: string): string | null => {
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
    onEditRequest(atributo, parseado);
    setEditando(false);
  };

  const manejarKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tipo !== "array") {
      e.preventDefault();
      const parseado = parsearValor(valorEditado, tipo);
      const errorValidacion = validar(parseado, tipo, atributo);
      if (!errorValidacion) {
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
    if (!editando) setEditando(true);
  };

  const manejarChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValorEditado(e.target.value);
    if (error) setError("");
  };

  const formatearMostrar = (valor: unknown): string => {
    if (valor === null || valor === undefined) return "—";
    if (tipo === "decimal") return `$${Number(valor).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
    if (tipo === "array") return (valor as string[]).join(", ") || "—";
    if (tipo === "boolean") return valor ? "Sí" : "No";
    return String(valor);
  };

  if (editando) {
    const inputType = "text";

    return (
      <div className="flex-1 w-full">
        {tipo === "array" ? (
          <textarea
            ref={textareaRef}
            value={valorEditado}
            onChange={manejarChange}
            onBlur={manejarBlur}
            onKeyDown={manejarKeyDown}
            onClick={(e) => e.stopPropagation()}
            className={`w-full rounded-btn border px-3 py-1.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-toasted-brown/40 ${
              error
                ? "border-danger text-danger bg-danger-bg"
                : "border-desert-sand/40 bg-white"
            }`}
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
            className={`w-full rounded-btn border px-3 py-1.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-toasted-brown/40 ${
              error
                ? "border-danger text-danger bg-danger-bg"
                : "border-desert-sand/40 bg-white"
            }`}
            placeholder={`Nuevo ${atributo}`}
            step={tipo === "decimal" ? "0.01" : undefined}
            min={tipo === "number" ? "0" : tipo === "decimal" ? "0" : undefined}
          />
        )}
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex-1 w-full" onClick={manejarClick}>
      <span className="text-dark-pine/70">{formatearMostrar(valorActual)}</span>
      <span className="ml-2 text-xs text-dark-pine/40 hover:text-toasted-brown cursor-pointer">✏️</span>
    </div>
  );
}
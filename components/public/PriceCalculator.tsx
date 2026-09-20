"use client";

import { useState, useTransition } from "react";
import { calcularPrecio } from "@/lib/actions/precios";
import { buildReservaWhatsApp } from "@/lib/config";

interface PriceCalculatorProps {
  propiedadId: string;
  nombre: string;
  capacidad: number;
}

const precioFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function PriceCalculator({
  propiedadId,
  nombre,
  capacidad,
}: PriceCalculatorProps) {
  const [ingreso, setIngreso] = useState("");
  const [salida, setSalida] = useState("");
  const [personas, setPersonas] = useState(Math.min(2, capacidad));
  const [resultado, setResultado] = useState<{
    precioPorNoche: number;
    totalEstadia: number;
    noches: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCalcular = () => {
    if (!ingreso || !salida) {
      setError("Seleccioná las fechas de ingreso y salida");
      return;
    }
    setError(null);
    setResultado(null);

    startTransition(async () => {
      const res = await calcularPrecio(propiedadId, ingreso, salida, personas);
      if ("error" in res) {
        setError(res.error);
      } else {
        setResultado(res);
      }
    });
  };

  const fechaInicioFmt = ingreso
    ? new Date(ingreso + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" })
    : "";
  const fechaFinFmt = salida
    ? new Date(salida + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" })
    : "";

  const whatsappHref = buildReservaWhatsApp(
    nombre,
    fechaInicioFmt || undefined,
    fechaFinFmt || undefined,
    personas
  );

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-[var(--color-ink)]">
        Consultar precio
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--color-ink)]/60">
            Ingreso
          </label>
          <input
            type="date"
            value={ingreso}
            min={new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10)}
            onChange={(e) => {
              setIngreso(e.target.value);
              if (e.target.value && salida && e.target.value >= salida) setSalida("");
            }}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--color-ink)]/60">
            Salida
          </label>
          <input
            type="date"
            value={salida}
            min={ingreso || new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10)}
            onChange={(e) => setSalida(e.target.value)}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-accent)]"
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-[var(--color-ink)]/60">
          Personas
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPersonas((p) => Math.max(1, p - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-ink)]/60 transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-ink)] active:scale-[0.97]"
          >
            −
          </button>
          <span className="min-w-[2ch] text-center text-sm font-medium text-[var(--color-ink)]">
            {personas}
          </span>
          <button
            type="button"
            onClick={() => setPersonas((p) => Math.min(capacidad, p + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-ink)]/60 transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-ink)] active:scale-[0.97]"
          >
            +
          </button>
          <span className="text-xs text-[var(--color-ink)]/50">
            de {capacidad} máximo
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCalcular}
        disabled={isPending || !ingreso || !salida}
        className="mt-4 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-ink)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
      >
        {isPending ? "Calculando..." : "Calcular precio"}
      </button>

      {error && (
        <p className="mt-3 text-sm text-[var(--color-danger)]">{error}</p>
      )}

      {resultado && (
        <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-bg)] p-4">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-[var(--color-ink)]/60">
              {precioFmt.format(resultado.precioPorNoche)} × {resultado.noches}{" "}
              {resultado.noches === 1 ? "noche" : "noches"}
            </span>
            <span className="text-lg font-semibold text-[var(--color-accent)]">
              {precioFmt.format(resultado.totalEstadia)}
            </span>
          </div>
        </div>
      )}

      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[var(--color-accent)]/90 active:scale-[0.97]"
      >
        Reservar por WhatsApp
      </a>
    </div>
  );
}

"use client";

import { useRef, useState, useTransition } from "react";
import { CalendarioEstadia } from "@/components/calendario/CalendarioEstadia";
import { useDisponibilidad } from "@/components/calendario/useDisponibilidad";
import { calcularEstadia } from "@/lib/actions/calcular-estadia";
import { buildReservaWhatsApp } from "@/lib/config";
import {
  ESTADIA_VACIA,
  type SeleccionEstadia,
} from "@/lib/disponibilidad/seleccion-estadia";
import type { EstadiaCalculada } from "@/lib/precios/estadia";

interface PriceCalculatorProps {
  propiedadId: string;
  nombre: string;
  capacidad: number;
}

const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const arsVenta = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usd = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const ETIQUETAS_TEMPORADA: Record<EstadiaCalculada["temporada"], string> = {
  ALTA: "Temporada alta",
  BAJA: "Temporada baja",
};

const ETIQUETAS_TRAMO: Record<EstadiaCalculada["tramo"], string> = {
  UNA_NOCHE: "1 noche",
  DE_DOS_A_SEIS: "2 a 6 noches",
  SIETE_O_MAS: "7 noches o más",
};

export default function PriceCalculator({
  propiedadId,
  nombre,
  capacidad,
}: PriceCalculatorProps) {
  const [seleccion, setSeleccion] = useState<SeleccionEstadia>(ESTADIA_VACIA);
  const [resultado, setResultado] = useState<EstadiaCalculada | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const solicitudRef = useRef(0);
  const { estado: disponibilidad, reintentar } = useDisponibilidad(propiedadId);

  // Cada cambio de fechas invalida cualquier respuesta que esté en curso.
  function cambiarSeleccion(nueva: SeleccionEstadia) {
    if (
      nueva.ingreso === seleccion.ingreso &&
      nueva.salida === seleccion.salida
    ) {
      return;
    }
    solicitudRef.current += 1;
    setSeleccion(nueva);
    setResultado(null);
    setErrorAccion(null);
  }

  function calcular() {
    const { ingreso, salida } = seleccion;
    if (!ingreso || !salida) return;
    setErrorAccion(null);
    setResultado(null);
    const id = ++solicitudRef.current;

    startTransition(async () => {
      try {
        const res = await calcularEstadia(propiedadId, ingreso, salida);
        if (id !== solicitudRef.current) return;
        if (res.ok) {
          setResultado(res.estadia);
        } else {
          setErrorAccion(res.mensaje);
        }
      } catch {
        if (id !== solicitudRef.current) return;
        setErrorAccion("No pudimos calcular el precio. Probá de nuevo.");
      }
    });
  }

  const whatsappHref = buildReservaWhatsApp(
    nombre,
    seleccion.ingreso ?? undefined,
    seleccion.salida ?? undefined
  );

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white/85 p-6 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-semibold text-[var(--color-ink)]">
        Consultar precio
      </h2>

      <CalendarioEstadia
        estado={disponibilidad}
        onReintentar={reintentar}
        propiedadId={propiedadId}
        seleccion={seleccion}
        onCambiar={cambiarSeleccion}
      />

      <p className="mt-3 text-xs text-[var(--color-ink)]/60">
        Capacidad máxima: {capacidad} huésped{capacidad === 1 ? "" : "es"}
      </p>

      <button
        type="button"
        onClick={calcular}
        disabled={isPending || !seleccion.ingreso || !seleccion.salida}
        className="mt-4 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-ink)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
      >
        {isPending ? "Calculando..." : "Calcular precio"}
      </button>

      {errorAccion && (
        <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">
          {errorAccion}
        </p>
      )}

      {resultado !== null && (
        <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-bg)] p-4">
          <p className="text-xs text-[var(--color-ink)]/60">
            {ETIQUETAS_TEMPORADA[resultado.temporada]} ·{" "}
            {ETIQUETAS_TRAMO[resultado.tramo]}
          </p>

          {resultado.totalArs !== null &&
          resultado.precioNocheAplicadoArs !== null ? (
            <div className="mt-2 space-y-1">
              {resultado.promoAplicadaPct > 0 &&
              resultado.precioNocheBaseArs !== null ? (
                <>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-[var(--color-ink)]/60">
                      Precio por noche
                    </span>
                    <span className="text-[var(--color-ink)]">
                      {ars.format(resultado.precioNocheBaseArs)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-[var(--color-ink)]/60">
                      Promoción {resultado.promoAplicadaPct}%
                    </span>
                    <span className="text-[var(--color-ink)]">
                      {ars.format(resultado.precioNocheAplicadoArs)} por noche
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-[var(--color-ink)]/60">
                    Precio por noche
                  </span>
                  <span className="text-[var(--color-ink)]">
                    {ars.format(resultado.precioNocheAplicadoArs)}
                  </span>
                </div>
              )}

              <div className="flex items-baseline justify-between text-sm">
                <span className="text-[var(--color-ink)]/60">
                  {resultado.noches}{" "}
                  {resultado.noches === 1 ? "noche" : "noches"} ×{" "}
                  {ars.format(resultado.precioNocheAplicadoArs)}
                </span>
                <span className="text-lg font-semibold text-[var(--color-accent)]">
                  {ars.format(resultado.totalArs)}
                </span>
              </div>

              <p className="text-xs text-[var(--color-ink)]/60">
                Referencia: {usd.format(resultado.totalUsd)} (
                {usd.format(resultado.precioNocheAplicadoUsd)} por noche)
              </p>
            </div>
          ) : (
            <div className="mt-2 space-y-1">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-[var(--color-ink)]/60">
                  Precio por noche
                </span>
                <span className="text-[var(--color-ink)]">
                  {usd.format(resultado.precioNocheAplicadoUsd)}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-[var(--color-ink)]/60">Total</span>
                <span className="font-semibold text-[var(--color-ink)]">
                  {usd.format(resultado.totalUsd)}
                </span>
              </div>
              <p className="text-xs text-[var(--color-ink)]/60">
                No pudimos obtener la cotización del dólar: consultá el valor
                en pesos por WhatsApp.
              </p>
            </div>
          )}

          {resultado.cotizacion !== null && (
            <div className="mt-2">
              <p className="text-xs text-[var(--color-ink)]/60">
                {resultado.cotizacion.etiqueta}: venta{" "}
                {arsVenta.format(resultado.cotizacion.venta)}
                {resultado.cotizacion.fechaTexto
                  ? ` · ${resultado.cotizacion.fechaTexto}`
                  : ""}
              </p>
              {resultado.cotizacion.desactualizada && (
                <p className="mt-2 rounded-[var(--radius-sm)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-2 text-xs text-[var(--color-ink)]">
                  Atención: la cotización puede estar desactualizada.
                </p>
              )}
            </div>
          )}

          <p className="mt-2 text-xs text-[var(--color-ink)]/60">
            Valor estimativo. La reserva se confirma por WhatsApp.
          </p>
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

"use client";

import { useState, useTransition, type CSSProperties } from "react";
import {
  actualizarTemporadaActiva,
  actualizarTipoDolar,
} from "@/lib/actions/configuracion-precios";
import type { Temporada } from "@/lib/precios/calcular";
import type { TipoDolar } from "@/lib/cotizacion";

const OPCIONES_TEMPORADA: ReadonlyArray<{ valor: Temporada; etiqueta: string }> = [
  { valor: "ALTA", etiqueta: "Temporada alta" },
  { valor: "BAJA", etiqueta: "Temporada baja" },
];

// Tonos replicados de ESTILOS_FORMULARIO (PropiedadCard.tsx) para que el panel
// comparta el lenguaje visual de las cabañas sin acoplarse a ese componente.
const ESTILOS_CONFIGURACION = {
  "--cfg-panel-bg": "#fbf8f6", // desierto 9% + blanco, igual que los paneles de cabañas
  "--cfg-panel-border": "#eee3da", // borde suave de panel
  "--cfg-field-border": "#c6b0a0", // borde de campo en reposo
  "--cfg-field-border-hover": "#ba9f8b", // borde de campo en hover
  "--cfg-field-hover-bg": "#fcfaf8", // blanco apenas teñido de beige
  "--cfg-brand-hover": "#865f43", // toasted-brown 8% más oscuro
  "--cfg-radio-checked-bg": "#e4e6e4", // dark-pine 12% + blanco
  "--cfg-disabled-bg": "#f3ebe5", // beige claro del estado deshabilitado
  "--cfg-disabled-border": "#e2d3c7", // borde suave del estado deshabilitado
} as CSSProperties;

const CLASES_BOTON_APLICAR =
  "inline-flex min-h-11 w-full items-center justify-center rounded-sm border border-transparent bg-toasted-brown px-5 text-sm font-semibold text-white transition-colors enabled:hover:bg-[color:var(--cfg-brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-pine focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:border-[color:var(--cfg-disabled-border)] disabled:bg-[color:var(--cfg-disabled-bg)] disabled:text-muted-dark sm:min-h-10 sm:w-auto";

export interface OpcionTipoDolar {
  tipo: TipoDolar;
  etiqueta: string;
  ventaTexto: string | null;
  desactualizada: boolean;
  fechaTexto: string | null;
}

interface PanelConfiguracionPreciosProps {
  tipoActivo: TipoDolar;
  opciones: OpcionTipoDolar[];
  temporadaActiva: Temporada;
}

export default function PanelConfiguracionPrecios({
  tipoActivo,
  opciones,
  temporadaActiva,
}: PanelConfiguracionPreciosProps) {
  const [seleccionado, setSeleccionado] = useState<TipoDolar>(tipoActivo);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [temporadaSeleccionada, setTemporadaSeleccionada] = useState<Temporada>(temporadaActiva);
  const [errorTemporada, setErrorTemporada] = useState<string | null>(null);
  const [mensajeTemporada, setMensajeTemporada] = useState<string | null>(null);
  const [isPendingTemporada, startTransitionTemporada] = useTransition();

  const opcionSeleccionada = opciones.find((opcion) => opcion.tipo === seleccionado) ?? null;

  function textoFecha(opcion: OpcionTipoDolar | null): string {
    if (!opcion || opcion.fechaTexto === null) {
      return "Sin cotización disponible para este tipo";
    }

    const base = `Cotización de ${opcion.etiqueta}: actualizada el ${opcion.fechaTexto}`;
    return opcion.desactualizada
      ? `${base} — datos desactualizados: la API no respondió, se usa la última cotización guardada`
      : base;
  }

  function cambiarTipo(valor: string): void {
    const opcion = opciones.find((item) => item.tipo === valor);
    if (!opcion) return;

    setSeleccionado(opcion.tipo);
    setError(null);
    setMensaje(null);
  }

  function aplicar(): void {
    setError(null);
    setMensaje(null);

    startTransition(async () => {
      const resultado = await actualizarTipoDolar(seleccionado);

      if (resultado.success) {
        setMensaje(
          "Tipo de dólar actualizado. Los precios en pesos del sitio usan ahora esta cotización."
        );
      } else {
        setError(resultado.error ?? "No se pudo actualizar el tipo de dólar");
        setSeleccionado(tipoActivo);
      }
    });
  }

  function cambiarTemporada(valor: string): void {
    const opcion = OPCIONES_TEMPORADA.find((item) => item.valor === valor);
    if (!opcion) return;

    setTemporadaSeleccionada(opcion.valor);
    setErrorTemporada(null);
    setMensajeTemporada(null);
  }

  function aplicarTemporada(): void {
    setErrorTemporada(null);
    setMensajeTemporada(null);

    startTransitionTemporada(async () => {
      const resultado = await actualizarTemporadaActiva(temporadaSeleccionada);

      if (resultado.success) {
        setMensajeTemporada(
          `Temporada actualizada. Los precios del sitio usan ahora la ${
            temporadaSeleccionada === "ALTA" ? "temporada alta" : "temporada baja"
          }.`
        );
      } else {
        setErrorTemporada(resultado.error ?? "No se pudo actualizar la temporada");
        setTemporadaSeleccionada(temporadaActiva);
      }
    });
  }

  return (
    <section
      className="rounded-lg border border-desert-sand/20 bg-white p-4 shadow-sm sm:p-5"
      style={ESTILOS_CONFIGURACION}
    >
      <h3 className="text-[18px] font-bold text-dark-pine">Configuración de precios</h3>

      <div className="mt-4 space-y-4">
        <section
          aria-labelledby="tipo-dolar-titulo"
          className="rounded-md border border-[color:var(--cfg-panel-border)] bg-[color:var(--cfg-panel-bg)] p-4 sm:p-5"
        >
          <h4
            id="tipo-dolar-titulo"
            className="flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-dark-pine"
          >
            <span aria-hidden="true" className="h-4 w-[2px] shrink-0 rounded-full bg-dark-pine" />
            Tipo de dólar
          </h4>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-dark">
            Tipo de dólar con el que se convierten a pesos los precios cargados en USD (se usa siempre
            el valor de venta). El cambio afecta los precios en pesos de todo el sitio.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="w-full sm:max-w-[420px]">
              <label htmlFor="tipo-dolar" className="sr-only">
                Tipo de dólar
              </label>
              <div className="relative">
                <select
                  id="tipo-dolar"
                  value={seleccionado}
                  onChange={(evento) => cambiarTipo(evento.target.value)}
                  className="min-h-11 w-full appearance-none rounded-sm border border-[color:var(--cfg-field-border)] bg-white py-2 pl-3 pr-10 text-[15px] font-medium text-dark-pine transition-colors hover:border-[color:var(--cfg-field-border-hover)] hover:bg-[color:var(--cfg-field-hover-bg)] focus-visible:border-dark-pine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-pine focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:min-h-10 sm:min-w-[280px]"
                >
                  {opciones.map((opcion) => (
                    <option
                      key={opcion.tipo}
                      value={opcion.tipo}
                      disabled={opcion.ventaTexto === null && opcion.tipo !== tipoActivo}
                    >
                      {opcion.ventaTexto === null
                        ? `${opcion.etiqueta} — sin datos`
                        : `${opcion.etiqueta} — ${opcion.ventaTexto}${
                            opcion.desactualizada ? " (desactualizada)" : ""
                          }`}
                    </option>
                  ))}
                </select>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-dark"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              <p className="mt-1.5 text-xs text-muted-dark">{textoFecha(opcionSeleccionada)}</p>
            </div>

            <button
              type="button"
              onClick={aplicar}
              disabled={isPending || seleccionado === tipoActivo}
              className={CLASES_BOTON_APLICAR}
            >
              {isPending ? "Guardando…" : "Aplicar"}
            </button>
          </div>

          {error ? (
            <p role="alert" className="mt-3 text-sm text-danger">
              ⚠ {error}
            </p>
          ) : null}

          {mensaje ? <p className="mt-3 text-sm text-success">{mensaje}</p> : null}
        </section>

        <section
          aria-labelledby="temporada-activa-titulo"
          className="rounded-md border border-[color:var(--cfg-panel-border)] bg-[color:var(--cfg-panel-bg)] p-4 sm:p-5"
        >
          <h4
            id="temporada-activa-titulo"
            className="flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-dark-pine"
          >
            <span aria-hidden="true" className="h-4 w-[2px] shrink-0 rounded-full bg-dark-pine" />
            Temporada activa
          </h4>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-dark">
            Temporada que se aplica a los precios de todo el sitio (tarjetas del home, ficha de cada
            cabaña, calculadora y pre-reserva). No depende de las fechas: se cambia manualmente
            desde acá.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div
              role="radiogroup"
              aria-labelledby="temporada-activa-titulo"
              className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap"
            >
              {OPCIONES_TEMPORADA.map((item) => (
                <div key={item.valor} className="relative min-w-[8.5rem] flex-1 sm:flex-none">
                  <input
                    id={`temporada-${item.valor.toLowerCase()}`}
                    type="radio"
                    name="temporada-activa"
                    value={item.valor}
                    checked={temporadaSeleccionada === item.valor}
                    onChange={() => cambiarTemporada(item.valor)}
                    disabled={isPendingTemporada}
                    className="peer sr-only"
                  />
                  <label
                    htmlFor={`temporada-${item.valor.toLowerCase()}`}
                    className="flex min-h-11 w-full cursor-pointer select-none items-center justify-center rounded-sm border border-[color:var(--cfg-field-border)] bg-white px-4 py-2.5 text-[15px] font-medium text-dark-pine transition-colors peer-enabled:hover:border-[color:var(--cfg-field-border-hover)] peer-enabled:hover:bg-[color:var(--cfg-field-hover-bg)] peer-checked:border-dark-pine peer-checked:bg-[color:var(--cfg-radio-checked-bg)] peer-checked:font-semibold peer-checked:ring-1 peer-checked:ring-dark-pine peer-focus-visible:ring-2 peer-focus-visible:ring-dark-pine peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-white peer-disabled:cursor-not-allowed peer-disabled:border-[color:var(--cfg-disabled-border)] peer-disabled:bg-[color:var(--cfg-disabled-bg)] peer-disabled:font-medium peer-disabled:text-muted-dark sm:min-h-10 sm:py-2"
                  >
                    {item.etiqueta}
                  </label>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={aplicarTemporada}
              disabled={isPendingTemporada || temporadaSeleccionada === temporadaActiva}
              className={CLASES_BOTON_APLICAR}
            >
              {isPendingTemporada ? "Guardando…" : "Aplicar"}
            </button>
          </div>

          {errorTemporada ? (
            <p role="alert" className="mt-3 text-sm text-danger">
              ⚠ {errorTemporada}
            </p>
          ) : null}

          {mensajeTemporada ? (
            <p className="mt-3 text-sm text-success">{mensajeTemporada}</p>
          ) : null}
        </section>
      </div>
    </section>
  );
}

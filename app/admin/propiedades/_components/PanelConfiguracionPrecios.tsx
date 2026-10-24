"use client";

import { useState, useTransition } from "react";
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
    <section className="rounded-lg border border-desert-sand/20 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-medium text-dark-pine">Configuración de precios</h3>
      <p className="mt-1 text-sm text-dark-pine/60">
        Tipo de dólar con el que se convierten a pesos los precios cargados en USD (se usa siempre
        el valor de venta). El cambio afecta los precios en pesos de todo el sitio.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="tipo-dolar"
            className="mb-1 block text-sm font-medium text-dark-pine"
          >
            Tipo de dólar
          </label>
          <select
            id="tipo-dolar"
            value={seleccionado}
            onChange={(evento) => cambiarTipo(evento.target.value)}
            className="rounded-btn border border-desert-sand/40 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-toasted-brown/40"
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
          <p className="mt-1 text-xs text-dark-pine/50">{textoFecha(opcionSeleccionada)}</p>
        </div>

        <button
          type="button"
          onClick={aplicar}
          disabled={isPending || seleccionado === tipoActivo}
          className="rounded-btn bg-toasted-brown px-4 py-2 text-sm font-medium text-white transition-all hover:bg-toasted-brown/90 disabled:opacity-50 disabled:cursor-not-allowed"
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

      <div className="mt-6 border-t border-desert-sand/20 pt-4">
        <fieldset>
          <legend className="text-sm font-medium text-dark-pine">Temporada activa</legend>
          <p className="mt-1 text-sm text-dark-pine/60">
            Temporada que se aplica a los precios de todo el sitio (tarjetas del home, ficha de cada
            cabaña, calculadora y pre-reserva). No depende de las fechas: se cambia manualmente
            desde acá.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            {OPCIONES_TEMPORADA.map((item) => (
              <label
                key={item.valor}
                className="flex items-center gap-2 text-sm text-dark-pine"
              >
                <input
                  type="radio"
                  name="temporada-activa"
                  value={item.valor}
                  checked={temporadaSeleccionada === item.valor}
                  onChange={() => cambiarTemporada(item.valor)}
                  disabled={isPendingTemporada}
                />
                {item.etiqueta}
              </label>
            ))}

            <button
              type="button"
              onClick={aplicarTemporada}
              disabled={isPendingTemporada || temporadaSeleccionada === temporadaActiva}
              className="rounded-btn bg-toasted-brown px-4 py-2 text-sm font-medium text-white transition-all hover:bg-toasted-brown/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPendingTemporada ? "Guardando…" : "Aplicar"}
            </button>
          </div>
        </fieldset>

        {errorTemporada ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            ⚠ {errorTemporada}
          </p>
        ) : null}

        {mensajeTemporada ? (
          <p className="mt-3 text-sm text-success">{mensajeTemporada}</p>
        ) : null}
      </div>
    </section>
  );
}

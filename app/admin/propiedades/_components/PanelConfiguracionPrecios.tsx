"use client";

import { useState, useTransition } from "react";
import { actualizarTipoDolar } from "@/lib/actions/configuracion-precios";
import type { TipoDolar } from "@/lib/cotizacion";

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
}

export default function PanelConfiguracionPrecios({
  tipoActivo,
  opciones,
}: PanelConfiguracionPreciosProps) {
  const [seleccionado, setSeleccionado] = useState<TipoDolar>(tipoActivo);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
    </section>
  );
}

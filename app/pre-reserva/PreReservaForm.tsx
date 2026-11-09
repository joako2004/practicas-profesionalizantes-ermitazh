"use client";

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";

import { CalendarioEstadia } from "@/components/calendario/CalendarioEstadia";
import { useDisponibilidad } from "@/components/calendario/useDisponibilidad";
import { buildWhatsAppLink } from "@/lib/config";
import {
  ESTADIA_VACIA,
  type SeleccionEstadia,
} from "@/lib/disponibilidad/seleccion-estadia";
import {
  TITULO_CABANAS_DISPONIBLES,
  mensajeHuespedesCabana,
  opcionesParaEstadia,
  type CabanaOpcion,
  type ResultadoOpcionesEstadia,
} from "@/lib/pre-reserva/cabanas-para-estadia";
import { contarCaracteres } from "@/lib/utils";

interface PreReservaFormProps {
  propiedades: CabanaOpcion[];
  cabanaInicialId?: string | null;
}

const MAX_CARACTERES_SIN_ESPACIOS = 1000;
const MAX_CARACTERES_TOTAL = 3000;
const UMBRAL_ADVERTENCIA = 900;

/** Devuelve la cantidad de huéspedes si el texto es un entero >= 1. */
function leerHuespedes(texto: string): number | null {
  const recortado = texto.trim();

  if (recortado === "") {
    return null;
  }

  const numero = Number(recortado);

  if (!Number.isInteger(numero) || numero < 1) {
    return null;
  }

  return numero;
}

/** Aviso cuando se piden más huéspedes que la mayor capacidad ofrecida. */
function mensajeNingunaCabanaAdmite(capacidadMaxima: number): string {
  return `Ninguna de nuestras cabañas admite más de ${capacidadMaxima} huéspedes.`;
}

/** Redirige al link de WhatsApp que devuelve el servidor. */
function redirigirAWhatsApp(mensaje: string): void {
  window.location.href = buildWhatsAppLink(mensaje);
}

function recortarAlLimite(texto: string): string {
  let resultado = "";
  let count = 0;

  for (const char of texto) {
    if (!/\s/.test(char)) {
      if (count >= MAX_CARACTERES_SIN_ESPACIOS) {
        break;
      }
      count++;
    }
    if (resultado.length >= MAX_CARACTERES_TOTAL) {
      break;
    }
    resultado += char;
  }

  return resultado;
}

export default function PreReservaForm({
  propiedades,
  cabanaInicialId = null,
}: PreReservaFormProps) {
  const [seleccion, setSeleccion] = useState<SeleccionEstadia>(ESTADIA_VACIA);
  const [huespedesTexto, setHuespedesTexto] = useState("2");
  const [cabanaElegidaId, setCabanaElegidaId] = useState("");
  const [nombre, setNombre] = useState("");
  const [informacionAdicional, setInformacionAdicional] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [datosPrecio, setDatosPrecio] = useState<
    | {
        totalEstimadoUsd: number | null;
        totalEstimadoArs: number | null;
        precioNocheUsdAplicado: number | null;
        tipoDolarUsado: string | null;
        cotizacionUsada: number | null;
        temporadaAplicada: string | null;
        tramoAplicado: string | null;
        propiedad_nombre: string | null;
        noches: number;
        promoAplicadaPct: number;
      }
    | null
  >(null);

  const cabanaFija = cabanaInicialId
    ? (propiedades.find((p) => p.id === cabanaInicialId) ?? null)
    : null;

  const { estado: estadoDisp, reintentar } = useDisponibilidad(cabanaFija?.id);

  const huespedesNum = leerHuespedes(huespedesTexto);
  // Sin propiedades no hay capacidad máxima que avisar.
  const capacidadMax =
    propiedades.length === 0
      ? null
      : propiedades.reduce(
          (mayor, propiedad) => Math.max(mayor, propiedad.capacidad),
          0,
        );
  const datosListos = estadoDisp.estado === "listo" ? estadoDisp.datos : null;
  const resultado: ResultadoOpcionesEstadia =
    cabanaFija === null && datosListos !== null && huespedesNum !== null
      ? opcionesParaEstadia(
          seleccion,
          huespedesNum,
          datosListos.cabanas,
          propiedades,
        )
      : { estado: "INCOMPLETO" };
  const cabanaId =
    cabanaFija !== null
      ? cabanaFija.id
      : resultado.estado === "OK" &&
          resultado.opciones.some((opcion) => opcion.id === cabanaElegidaId)
        ? cabanaElegidaId
        : "";
  const cabanaSeleccionada =
    cabanaFija === null && resultado.estado === "OK" && cabanaId !== ""
      ? (resultado.opciones.find((opcion) => opcion.id === cabanaId) ?? null)
      : null;
  const cabanaDescartada =
    cabanaFija === null &&
    resultado.estado === "OK" &&
    cabanaElegidaId !== "" &&
    cabanaId === "";
  const errorHuespedes =
    cabanaFija !== null
      ? mensajeHuespedesCabana(
          Number(huespedesTexto.trim()),
          cabanaFija.capacidad,
        )
      : huespedesNum === null
        ? "Indicá una cantidad de huéspedes válida."
        : null;
  const intervaloCompleto =
    seleccion.ingreso !== null && seleccion.salida !== null;
  const avisoCapacidad =
    cabanaFija === null &&
    !intervaloCompleto &&
    capacidadMax !== null &&
    huespedesNum !== null &&
    huespedesNum > capacidadMax
      ? mensajeNingunaCabanaAdmite(capacidadMax)
      : null;
  const avisoHuespedes =
    cabanaFija === null &&
    (resultado.estado === "NINGUNA_LIBRE" ||
      resultado.estado === "NINGUNA_CON_CAPACIDAD")
      ? resultado.mensaje
      : avisoCapacidad;
  const puedeEnviar =
    !loading &&
    datosListos !== null &&
    intervaloCompleto &&
    cabanaId !== "" &&
    nombre.trim() !== "" &&
    huespedesNum !== null &&
    errorHuespedes === null;

  // Obtener precio de la estadía cuando tanto las fechas como la cabaña estén seleccionadas
  const precioListo =
    seleccion.ingreso !== null &&
    seleccion.salida !== null &&
    cabanaId !== "";


function fetchPrecioEstadia() {
    if (!precioListo) return;

    setDatosPrecio(null);

    fetch("/api/pre-reserva/precio?propiedad_id=" + cabanaId + "&fecha_inicio=" + seleccion.ingreso + "&fecha_fin=" + seleccion.salida, {
      method: "GET",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Error al obtener precio");
        }
        return res.json();
      })
      .then((data) => {
        setDatosPrecio(data);
      })
      .catch((err) => {
        console.error("Error fetching precio:", err);
      });
  }

  // Ejecutar fetch de precio cuando la selección cambia a "listo"
  useEffect(() => {
    if (precioListo) {
      fetchPrecioEstadia();
    }
  }, [precioListo]);

  const caracteresSinEspacios = contarCaracteres(informacionAdicional);
  const cercaDelLimite = caracteresSinEspacios >= UMBRAL_ADVERTENCIA;
  const excedeLimite = caracteresSinEspacios > MAX_CARACTERES_SIN_ESPACIOS;

  let faltante: string | null = null;
  if (!puedeEnviar && !loading && estadoDisp.estado === "listo") {
    if (!intervaloCompleto) {
      faltante = "Elegí tus fechas en el calendario.";
    } else if (
      cabanaFija === null &&
      resultado.estado === "OK" &&
      cabanaId === ""
    ) {
      faltante = "Elegí una cabaña de la lista.";
    } else if (nombre.trim() === "") {
      faltante = "Ingresá tu nombre.";
    }
  }

  function cambiarSeleccion(nueva: SeleccionEstadia) {
    if (
      nueva.ingreso === seleccion.ingreso &&
      nueva.salida === seleccion.salida
    ) {
      return;
    }

    setSeleccion(nueva);
    setError("");
  }

  function handleInformacionAdicionalChange(
    e: ChangeEvent<HTMLTextAreaElement>,
  ) {
    const nuevoValor = e.target.value;

    if (nuevoValor.length > MAX_CARACTERES_TOTAL) {
      setInformacionAdicional(recortarAlLimite(nuevoValor));
      return;
    }

    const recortado = recortarAlLimite(nuevoValor);
    setInformacionAdicional(recortado);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (
      !puedeEnviar ||
      seleccion.ingreso === null ||
      seleccion.salida === null
    ) {
      return;
    }

    if (excedeLimite) {
      setError(
        `La información adicional supera el límite de ${MAX_CARACTERES_SIN_ESPACIOS} caracteres (sin contar espacios)`,
      );
      return;
    }

    if (informacionAdicional.length > MAX_CARACTERES_TOTAL) {
      setError(
        `La información adicional supera el límite de ${MAX_CARACTERES_TOTAL} caracteres totales`,
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/pre-reserva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propiedad_id: cabanaId,
          fecha_inicio: seleccion.ingreso,
          fecha_fin: seleccion.salida,
          huesped_nombre: nombre.trim(),
          personas: huespedesNum,
          informacion_adicional: informacionAdicional.trim() || null,
        }),
      });

      const data: { error?: string; mensaje?: string } | null = await res
        .json()
        .catch(() => null);

      if (!res.ok) {
        if (res.status === 409) {
          reintentar();
          setSeleccion(ESTADIA_VACIA);
        }
        throw new Error(data?.error || "Error al crear la pre-reserva");
      }

      if (data === null || typeof data.mensaje !== "string") {
        throw new Error("Respuesta inesperada del servidor");
      }

      redirigirAWhatsApp(data.mensaje);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocurrió un error inesperado",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[var(--radius-lg)] bg-white shadow-lg ring-1 ring-[var(--color-border)] p-6 md:p-8"
    >
      {cabanaFija !== null && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm">
          <p className="font-medium text-[var(--color-ink)]">
            Cabaña: {cabanaFija.nombre}
          </p>
          <Link
            href="/pre-reserva"
            className="font-medium text-[var(--color-accent)] underline-offset-4 hover:underline"
          >
            Ver otras cabañas
          </Link>
        </div>
      )}

      <div className="mb-4">
        <CalendarioEstadia
          estado={estadoDisp}
          onReintentar={reintentar}
          propiedadId={cabanaFija?.id}
          seleccion={seleccion}
          onCambiar={cambiarSeleccion}
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="personas"
          className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]"
        >
          Huéspedes
        </label>
        <input
          id="personas"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          max={
            cabanaFija !== null
              ? cabanaFija.capacidad
              : (capacidadMax ?? undefined)
          }
          value={huespedesTexto}
          onChange={(e) => {
            setHuespedesTexto(e.target.value);
            setError("");
          }}
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
        />
        {errorHuespedes !== null && (
          <p className="mt-1.5 text-xs text-[var(--color-danger)]">
            {errorHuespedes}
          </p>
        )}
      </div>

      {cabanaFija === null && resultado.estado === "OK" && (
        <div className="mb-4">
          <label
            htmlFor="cabana"
            className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]"
          >
            {TITULO_CABANAS_DISPONIBLES}
          </label>
          <select
            id="cabana"
            value={cabanaId}
            onChange={(e) => {
              setCabanaElegidaId(e.target.value);
              setError("");
            }}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
          >
            <option value="">Elegí una cabaña</option>
            {resultado.opciones.map((opcion) => (
              <option key={opcion.id} value={opcion.id}>
                {opcion.nombre} (hasta {opcion.capacidad} huéspedes)
              </option>
            ))}
          </select>
          {cabanaSeleccionada !== null && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm">
              <p className="text-[var(--color-ink)]">
                Cabaña seleccionada:{" "}
                <span className="font-medium">{cabanaSeleccionada.nombre}</span>
              </p>
              <p className="text-[var(--color-ink)]/70">
                Capacidad: {cabanaSeleccionada.capacidad}{" "}
                {cabanaSeleccionada.capacidad === 1 ? "huésped" : "huéspedes"}
              </p>
            </div>
          )}
          {cabanaDescartada && (
            <p
              role="status"
              className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-3 text-sm text-[var(--color-ink)]"
            >
              La cabaña que habías elegido ya no está disponible para esta
              estadía. Elegí otra de la lista.
            </p>
          )}
        </div>
      )}

      {avisoHuespedes !== null && (
        <p
          role="status"
          className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-3 text-sm text-[var(--color-ink)]"
        >
          {avisoHuespedes}
        </p>
      )}

      <div className="mb-4">
        <label
          htmlFor="nombre"
          className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]"
        >
          Nombre completo
        </label>
        <input
          id="nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre"
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
          required
        />
      </div>

      <div className="mb-6">
        <label
          htmlFor="informacion-adicional"
          className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]"
        >
          Información adicional
        </label>
        <textarea
          id="informacion-adicional"
          value={informacionAdicional}
          onChange={handleInformacionAdicionalChange}
          placeholder="Contanos cualquier detalle que quieras que tengamos en cuenta"
          rows={4}
          className={`w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10 resize-y ${
            excedeLimite
              ? "border-[var(--color-danger)] focus:border-[var(--color-danger)]"
              : ""
          }`}
        />
        <p
          className={`mt-1.5 text-xs text-right transition-colors ${
            excedeLimite
              ? "text-[var(--color-danger)]"
              : cercaDelLimite
                ? "text-[var(--color-warning)]"
                : "text-[var(--color-muted)]"
          }`}
        >
          {caracteresSinEspacios} / {MAX_CARACTERES_SIN_ESPACIOS} caracteres
          (sin contar espacios)
        </p>
      </div>

      {faltante !== null && (
        <p className="mb-4 text-sm text-[var(--color-ink)]/70">{faltante}</p>
      )}

      {error !== "" && (
        <div className="mb-6 rounded-[var(--radius-md)] bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] px-4 py-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {/* Sección de precio integrada - aparece después de seleccionar cabaña y fechas */}
      {precioListo && datosPrecio && (
        <div className="mb-6 p-4 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-border">
          <h4 className="font-medium text-[var(--color-ink)] mb-3">
            Precio estimado para {datosPrecio.noches} noches
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[var(--color-ink)]/60 text-xs">Precio por noche</p>
              <p className="text-accent font-medium">${datosPrecio.precioNocheUsdAplicado}</p>
            </div>
            <div>
              <p className="text-[var(--color-ink)]/60 text-xs">Total estimado</p>
              <p className="font-bold text-[var(--color-ink)]">${datosPrecio.totalEstimadoArs}</p>
            </div>
          </div>
          {datosPrecio.promoAplicadaPct > 0 && (
            <p className="mt-2 text-green-600 text-sm">
              🎉 Promoción de semana: -{datosPrecio.promoAplicadaPct}% para estancias de 7 noches o más
            </p>
          )}
          {datosPrecio.cotizacionUsada !== null && datosPrecio.tipoDolarUsado && (
            <p className="mt-2 text-[var(--color-ink)]/60 text-xs">
              Dólar: {datosPrecio.tipoDolarUsado} (cotización: {datosPrecio.cotizacionUsada})
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={!puedeEnviar}
        className="w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[var(--color-accent)]/90 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Enviando..." : "Enviar pre-reserva por WhatsApp"}
      </button>
    </form>
  );
}

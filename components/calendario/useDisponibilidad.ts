"use client";

/**
 * useDisponibilidad — consulta la disponibilidad pública del calendario.
 *
 * Decisiones:
 * - Toda consulta se hace sin caché (`cache: "no-store"`).
 * - Cada consulta nueva aborta la anterior y solo la última puede escribir el
 *   estado; un aborto no se muestra como error.
 * - El resultado se guarda junto con la clave consultada (`propiedadId`). Así,
 *   mientras no llegue la respuesta de la clave actual, el estado derivado es
 *   "cargando" y nunca se muestran datos de otra cabaña.
 * - Al volver a la pestaña se vuelve a consultar sin borrar los datos que ya
 *   están en pantalla. Si esa consulta falla, pasa a "error".
 * - Ante cualquier respuesta dudosa se devuelve "error": es preferible no
 *   dejar elegir fechas antes que mostrar libre una noche ocupada.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import {
  leerRespuestaDisponibilidad,
  type DisponibilidadCliente,
} from "@/lib/disponibilidad/respuesta-api";

/** Estado visible de la consulta de disponibilidad. */
export type EstadoDisponibilidad =
  | { estado: "cargando" }
  | { estado: "error"; mensaje: string }
  | { estado: "listo"; datos: DisponibilidadCliente };

/** Resultado guardado junto con la clave de la consulta que lo produjo. */
type Resultado =
  | { propiedadId: string | undefined; estado: "error"; mensaje: string }
  | {
      propiedadId: string | undefined;
      estado: "listo";
      datos: DisponibilidadCliente;
    };

/** Mensaje genérico ante cualquier fallo de la consulta. */
const MENSAJE_ERROR = "No pudimos cargar la disponibilidad.";

/** Mensaje específico cuando la cabaña pedida no existe o está inactiva. */
const MENSAJE_CABANA_NO_DISPONIBLE =
  "Esta cabaña no está disponible para reservar.";

/** Indica si el error es un aborto provocado por nosotros. */
function esAborto(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

/** Mensaje que corresponde a una respuesta HTTP no exitosa. */
function mensajeDeRespuesta(
  status: number,
  propiedadId: string | undefined,
): string {
  if (status === 404 && propiedadId !== undefined) {
    return MENSAJE_CABANA_NO_DISPONIBLE;
  }
  return MENSAJE_ERROR;
}

/**
 * Consulta GET /api/disponibilidad y devuelve el estado visible más una
 * función para reintentar.
 */
export function useDisponibilidad(propiedadId?: string): {
  estado: EstadoDisponibilidad;
  reintentar: () => void;
} {
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const controladorRef = useRef<AbortController | null>(null);
  const ultimaConsultaRef = useRef(0);

  const consultar = useCallback((): void => {
    // La consulta anterior deja de importar: se aborta y se invalida.
    controladorRef.current?.abort();

    const numero = ultimaConsultaRef.current + 1;
    ultimaConsultaRef.current = numero;

    const controlador = new AbortController();
    controladorRef.current = controlador;

    const url =
      propiedadId === undefined
        ? "/api/disponibilidad"
        : `/api/disponibilidad?propiedadId=${encodeURIComponent(propiedadId)}`;

    // Las escrituras van en callbacks, nunca en el cuerpo síncrono del efecto.
    fetch(url, { cache: "no-store", signal: controlador.signal })
      .then((respuesta) => {
        if (numero !== ultimaConsultaRef.current) {
          return;
        }

        if (!respuesta.ok) {
          setResultado({
            propiedadId,
            estado: "error",
            mensaje: mensajeDeRespuesta(respuesta.status, propiedadId),
          });
          return;
        }

        return respuesta.json().then((json: unknown) => {
          if (numero !== ultimaConsultaRef.current) {
            return;
          }

          const datos = leerRespuestaDisponibilidad(json);

          if (datos === null) {
            setResultado({
              propiedadId,
              estado: "error",
              mensaje: MENSAJE_ERROR,
            });
            return;
          }

          setResultado({ propiedadId, estado: "listo", datos });
        });
      })
      .catch((error: unknown) => {
        if (numero !== ultimaConsultaRef.current) {
          return;
        }
        if (esAborto(error) || controlador.signal.aborted) {
          return;
        }
        setResultado({ propiedadId, estado: "error", mensaje: MENSAJE_ERROR });
      });
  }, [propiedadId]);

  useEffect(() => {
    consultar();

    function alCambiarVisibilidad(): void {
      if (document.visibilityState === "visible") {
        consultar();
      }
    }

    document.addEventListener("visibilitychange", alCambiarVisibilidad);

    return () => {
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      // Invalida cualquier respuesta en vuelo antes de abortarla.
      ultimaConsultaRef.current += 1;
      controladorRef.current?.abort();
    };
  }, [consultar]);

  const estado: EstadoDisponibilidad =
    resultado !== null && resultado.propiedadId === propiedadId
      ? resultado.estado === "listo"
        ? { estado: "listo", datos: resultado.datos }
        : { estado: "error", mensaje: resultado.mensaje }
      : { estado: "cargando" };

  const reintentar = useCallback((): void => {
    // Solo se vuelve a "cargando" si el estado actual es un error.
    setResultado((actual) =>
      actual !== null &&
      actual.propiedadId === propiedadId &&
      actual.estado === "error"
        ? null
        : actual,
    );
    consultar();
  }, [consultar, propiedadId]);

  return { estado, reintentar };
}

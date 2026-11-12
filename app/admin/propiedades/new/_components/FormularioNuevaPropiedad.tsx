"use client";

import Link from "next/link";
import {
  useState,
  useTransition,
  type CSSProperties,
  type FormEvent,
} from "react";

import { crearPropiedadNueva } from "@/lib/actions/crear-propiedad";
import { subirFotoDeCabana } from "@/lib/fotos/subir-archivo";
import {
  LIMITES_PROPIEDAD,
  validarNuevaPropiedad,
} from "@/lib/propiedades/validar-nueva";

import CampoServicios from "./CampoServicios";
import SelectorFotosNuevaPropiedad, {
  liberarMiniaturas,
  type FotoSeleccionada,
} from "./SelectorFotosNuevaPropiedad";

type CampoPrecio =
  | "precioNocheAltaUsd"
  | "precioNocheBajaUsd"
  | "precio2a6AltaUsd"
  | "precio2a6BajaUsd"
  | "promoSemanalAlta"
  | "promoSemanalBaja";

interface PreciosFormulario {
  precioNocheAltaUsd: string;
  precioNocheBajaUsd: string;
  precio2a6AltaUsd: string;
  precio2a6BajaUsd: string;
  promoSemanalAlta: string;
  promoSemanalBaja: string;
}

interface EntradaNuevaPropiedad {
  nombre: string;
  descripcion: string;
  capacidad: string;
  orden: string;
  activa: boolean;
  servicios: string[];
  precioNocheAltaUsd: string;
  precioNocheBajaUsd: string;
  precio2a6AltaUsd: string;
  precio2a6BajaUsd: string;
  promoSemanalAlta: string;
  promoSemanalBaja: string;
}

interface FilaPrecio {
  etiqueta: string;
  detalle: string;
  campoAlta: CampoPrecio;
  campoBaja: CampoPrecio;
  placeholder: string;
}

interface ResultadoSubidaFotos {
  subidas: number;
  fallidas: number;
}

const PRECIOS_INICIALES: PreciosFormulario = {
  precioNocheAltaUsd: "",
  precioNocheBajaUsd: "",
  precio2a6AltaUsd: "",
  precio2a6BajaUsd: "",
  promoSemanalAlta: "",
  promoSemanalBaja: "",
};

const FILAS_PRECIOS: readonly FilaPrecio[] = [
  {
    etiqueta: "1 noche",
    detalle: "USD",
    campoAlta: "precioNocheAltaUsd",
    campoBaja: "precioNocheBajaUsd",
    placeholder: "Sin precio",
  },
  {
    etiqueta: "2 a 6 noches, por noche",
    detalle: "USD",
    campoAlta: "precio2a6AltaUsd",
    campoBaja: "precio2a6BajaUsd",
    placeholder: "Sin precio",
  },
  {
    etiqueta: "7 o más noches",
    detalle: "descuento %",
    campoAlta: "promoSemanalAlta",
    campoBaja: "promoSemanalBaja",
    placeholder: "0",
  },
];

const ORDEN_CAMPOS = [
  "nombre",
  "descripcion",
  "capacidad",
  "orden",
  "servicios",
  "precioNocheAltaUsd",
  "precioNocheBajaUsd",
  "precio2a6AltaUsd",
  "precio2a6BajaUsd",
  "promoSemanalAlta",
  "promoSemanalBaja",
] as const;

type CampoFormulario = (typeof ORDEN_CAMPOS)[number];

const IDS_CAMPO: Record<CampoFormulario, string> = {
  nombre: "propiedad-nombre",
  descripcion: "propiedad-descripcion",
  capacidad: "propiedad-capacidad",
  orden: "propiedad-orden",
  servicios: "propiedad-servicios",
  precioNocheAltaUsd: "propiedad-precioNocheAltaUsd",
  precioNocheBajaUsd: "propiedad-precioNocheBajaUsd",
  precio2a6AltaUsd: "propiedad-precio2a6AltaUsd",
  precio2a6BajaUsd: "propiedad-precio2a6BajaUsd",
  promoSemanalAlta: "propiedad-promoSemanalAlta",
  promoSemanalBaja: "propiedad-promoSemanalBaja",
};

// Mismos tonos que ESTILOS_FORMULARIO de PropiedadCard: el formulario nuevo
// comparte el lenguaje visual de las tarjetas sin acoplarse a ese componente.
const ESTILOS_FORMULARIO = {
  "--form-panel-bg": "#fbf8f6",
  "--form-panel-border": "#eee3da",
  "--form-table-head-bg": "#f3ebe5",
  "--form-divider": "#ecdfd5",
  "--form-field-border": "#c6b0a0",
  "--form-field-border-hover": "#ba9f8b",
  "--form-field-border-empty": "#d5c4b7",
  "--form-field-bg-empty": "#f9f4f1",
  "--form-field-hover-bg": "#fcfaf8",
  "--form-brand-hover": "#865f43",
  "--form-disabled-bg": "#f3ebe5",
  "--form-disabled-border": "#e2d3c7",
} as CSSProperties;

const CLASE_CAMPO_BASE =
  "w-full rounded-sm border px-3 text-[15px] font-medium transition-colors placeholder:font-normal placeholder:text-muted-dark/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white";

const CLASE_ETIQUETA = "mb-1.5 block text-xs font-medium text-muted-dark";
const CLASE_AYUDA = "mt-1.5 text-xs leading-relaxed text-muted-dark";
const CLASE_ERROR = "mt-1.5 text-xs font-medium text-danger";

const CLASE_BOTON_PRIMARIO =
  "inline-flex min-h-11 items-center justify-center rounded-sm border border-transparent bg-toasted-brown px-5 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--form-brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-pine focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:border-[color:var(--form-disabled-border)] disabled:bg-[color:var(--form-disabled-bg)] disabled:text-muted-dark disabled:hover:bg-[color:var(--form-disabled-bg)] sm:min-h-10";

const CLASE_BOTON_SECUNDARIO =
  "inline-flex min-h-11 items-center justify-center rounded-sm border border-[color:var(--form-field-border)] bg-white px-5 text-sm font-semibold text-dark-pine transition-colors hover:border-[color:var(--form-field-border-hover)] hover:bg-[color:var(--form-field-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-pine focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:min-h-10";

const CLASE_TITULO_SECCION =
  "flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-dark-pine";
const CLASE_BARRA_SECCION =
  "h-4 w-[2px] shrink-0 rounded-full bg-dark-pine";

function clasesCampo(conError: boolean): string {
  return `${CLASE_CAMPO_BASE} ${
    conError
      ? "border-danger bg-danger-bg text-danger focus:ring-danger"
      : "border-[color:var(--form-field-border)] bg-white text-dark-pine hover:border-[color:var(--form-field-border-hover)] focus:border-dark-pine focus:ring-dark-pine"
  }`;
}

// Igual que en AtributoEditable: la coma se acepta como separador decimal.
function normalizarDecimal(texto: string): string {
  return texto.trim().replace(",", ".");
}

function descritoPor(...ids: Array<string | null>): string | undefined {
  const presentes = ids.filter((item): item is string => item !== null);
  return presentes.length > 0 ? presentes.join(" ") : undefined;
}

export default function FormularioNuevaPropiedad() {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [orden, setOrden] = useState("");
  const [servicios, setServicios] = useState<string[]>([]);
  const [precios, setPrecios] = useState<PreciosFormulario>(PRECIOS_INICIALES);
  const [activa, setActiva] = useState(false);

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [creada, setCreada] = useState<{ id: string; nombre: string } | null>(null);
  const [fotos, setFotos] = useState<FotoSeleccionada[]>([]);
  const [progresoFotos, setProgresoFotos] = useState<string | null>(null);
  const [resultadoFotos, setResultadoFotos] =
    useState<ResultadoSubidaFotos | null>(null);
  const [isPending, startTransition] = useTransition();

  function limpiarError(campo: string): void {
    setErrores((anteriores) => {
      if (!anteriores[campo]) return anteriores;
      const siguientes = { ...anteriores };
      delete siguientes[campo];
      return siguientes;
    });
  }

  function actualizarPrecio(campo: CampoPrecio, valorCampo: string): void {
    setPrecios((anteriores) => ({ ...anteriores, [campo]: valorCampo }));
    limpiarError(campo);
  }

  function construirEntrada(): EntradaNuevaPropiedad {
    return {
      nombre,
      descripcion,
      capacidad,
      orden,
      activa,
      servicios,
      precioNocheAltaUsd: normalizarDecimal(precios.precioNocheAltaUsd),
      precioNocheBajaUsd: normalizarDecimal(precios.precioNocheBajaUsd),
      precio2a6AltaUsd: normalizarDecimal(precios.precio2a6AltaUsd),
      precio2a6BajaUsd: normalizarDecimal(precios.precio2a6BajaUsd),
      promoSemanalAlta: normalizarDecimal(precios.promoSemanalAlta),
      promoSemanalBaja: normalizarDecimal(precios.promoSemanalBaja),
    };
  }

  function enfocarPrimerError(listaErrores: Record<string, string>): void {
    const campo = ORDEN_CAMPOS.find((item) => Boolean(listaErrores[item]));
    if (!campo) return;

    const id = IDS_CAMPO[campo];
    requestAnimationFrame(() => {
      document.getElementById(id)?.focus();
    });
  }

  function manejarEnvio(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    if (isPending) return;

    setErrorGeneral(null);
    setProgresoFotos(null);
    setResultadoFotos(null);

    const entrada = construirEntrada();
    const validacion = validarNuevaPropiedad(entrada);

    if (!validacion.ok) {
      const erroresCampo: Record<string, string> = {};
      for (const [campo, mensaje] of Object.entries(validacion.errores)) {
        if (typeof mensaje === "string") {
          erroresCampo[campo] = mensaje;
        }
      }

      setErrores(erroresCampo);
      setErrorGeneral(erroresCampo.general ?? null);
      enfocarPrimerError(erroresCampo);
      return;
    }

    setErrores({});

    startTransition(async () => {
      const resultado = await crearPropiedadNueva(entrada);

      if (!resultado.success) {
        // Las fotos elegidas se conservan para reintentar el alta.
        if (resultado.errores) {
          setErrores(resultado.errores);
          setErrorGeneral(resultado.errores.general ?? null);
          enfocarPrimerError(resultado.errores);
        } else {
          setErrorGeneral(resultado.error);
        }
        return;
      }

      if (fotos.length > 0) {
        let subidas = 0;
        let fallidas = 0;

        // Secuencial a propósito: una subida por vez, sin saturar el almacén.
        for (let indice = 0; indice < fotos.length; indice += 1) {
          setProgresoFotos(
            `Subiendo foto ${indice + 1} de ${fotos.length}…`
          );

          const subida = await subirFotoDeCabana(
            resultado.id,
            fotos[indice].archivo
          );

          if (subida.ok) {
            subidas += 1;
          } else {
            fallidas += 1;
          }
        }

        setProgresoFotos(null);
        setResultadoFotos({ subidas, fallidas });
      }

      setCreada({ id: resultado.id, nombre: resultado.nombre });
    });
  }

  function reiniciar(): void {
    liberarMiniaturas(fotos);
    setFotos([]);
    setNombre("");
    setDescripcion("");
    setCapacidad("");
    setOrden("");
    setServicios([]);
    setPrecios(PRECIOS_INICIALES);
    setActiva(false);
    setErrores({});
    setErrorGeneral(null);
    setCreada(null);
    setProgresoFotos(null);
    setResultadoFotos(null);
  }

  return (
    <div
      className="rounded-lg border border-desert-sand/20 bg-white p-4 shadow-sm sm:p-5"
      style={ESTILOS_FORMULARIO}
    >
      {creada ? (
        <div>
          <div className="rounded-md border border-success-border bg-success-bg p-4 sm:p-5">
            <h3 className={CLASE_TITULO_SECCION}>
              <span aria-hidden="true" className={CLASE_BARRA_SECCION} />
              Cabaña creada
            </h3>
            <p className="mt-2 text-lg font-semibold text-dark-pine">{creada.nombre}</p>
            <p className="mt-1 text-sm leading-relaxed text-dark-pine/75">
              Ya forma parte del catálogo. Podés cargar sus fotos o volver al listado.
            </p>

            {resultadoFotos ? (
              resultadoFotos.fallidas === 0 ? (
                <p className="mt-2 text-sm font-medium text-dark-pine">
                  {resultadoFotos.subidas === 1
                    ? "Se subió 1 foto."
                    : `Se subieron ${resultadoFotos.subidas} fotos.`}
                </p>
              ) : (
                <div
                  role="alert"
                  className="mt-3 rounded-md border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger"
                >
                  <p>
                    {resultadoFotos.fallidas === 1
                      ? "La cabaña se creó, pero 1 foto no se pudo subir."
                      : `La cabaña se creó, pero ${resultadoFotos.fallidas} fotos no se pudieron subir.`}
                  </p>
                  {resultadoFotos.subidas > 0 ? (
                    <p className="mt-1">
                      {resultadoFotos.subidas === 1
                        ? "Se subió 1 foto."
                        : `Se subieron ${resultadoFotos.subidas} fotos.`}
                    </p>
                  ) : null}
                </div>
              )
            ) : null}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link href={`/admin/fotos/${creada.id}`} className={CLASE_BOTON_PRIMARIO}>
              Cargar fotos
            </Link>
            <Link href="/admin/propiedades" className={CLASE_BOTON_SECUNDARIO}>
              Ver propiedades
            </Link>
            <button type="button" onClick={reiniciar} className={CLASE_BOTON_SECUNDARIO}>
              Crear otra
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={manejarEnvio} noValidate aria-busy={isPending}>
          <fieldset
            disabled={isPending}
            className="min-w-0 space-y-4 sm:space-y-5"
          >
          <section
            aria-labelledby="propiedad-info-general"
            className="rounded-md border border-[color:var(--form-panel-border)] bg-[color:var(--form-panel-bg)] p-4 sm:p-5"
          >
            <h4 id="propiedad-info-general" className={CLASE_TITULO_SECCION}>
              <span aria-hidden="true" className={CLASE_BARRA_SECCION} />
              Información general
            </h4>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              <div className="sm:col-span-2">
                <label htmlFor="propiedad-nombre" className={CLASE_ETIQUETA}>
                  Nombre
                </label>
                <input
                  id="propiedad-nombre"
                  type="text"
                  value={nombre}
                  onChange={(evento) => {
                    setNombre(evento.target.value);
                    limpiarError("nombre");
                  }}
                  maxLength={LIMITES_PROPIEDAD.nombreMax}
                  aria-invalid={errores.nombre ? true : undefined}
                  aria-describedby={descritoPor(
                    errores.nombre ? "propiedad-nombre-error" : null
                  )}
                  className={`${clasesCampo(Boolean(errores.nombre))} min-h-11 sm:min-h-10`}
                />
                {errores.nombre ? (
                  <p id="propiedad-nombre-error" role="alert" className={CLASE_ERROR}>
                    {errores.nombre}
                  </p>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="propiedad-descripcion" className={CLASE_ETIQUETA}>
                  Descripción
                </label>
                <textarea
                  id="propiedad-descripcion"
                  value={descripcion}
                  onChange={(evento) => {
                    setDescripcion(evento.target.value);
                    limpiarError("descripcion");
                  }}
                  rows={5}
                  maxLength={LIMITES_PROPIEDAD.descripcionMax}
                  aria-invalid={errores.descripcion ? true : undefined}
                  aria-describedby={descritoPor(
                    "propiedad-descripcion-contador",
                    errores.descripcion ? "propiedad-descripcion-error" : null
                  )}
                  className={`${clasesCampo(Boolean(errores.descripcion))} min-h-28 resize-y py-2.5`}
                />
                <div className="mt-1.5 flex items-start justify-between gap-3">
                  <span className="text-xs leading-relaxed text-muted-dark">
                    Se muestra en la ficha de la cabaña.
                  </span>
                  <span
                    id="propiedad-descripcion-contador"
                    className="shrink-0 text-xs tabular-nums text-muted-dark"
                  >
                    {descripcion.length}/{LIMITES_PROPIEDAD.descripcionMax}
                  </span>
                </div>
                {errores.descripcion ? (
                  <p id="propiedad-descripcion-error" role="alert" className={CLASE_ERROR}>
                    {errores.descripcion}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="propiedad-capacidad" className={CLASE_ETIQUETA}>
                  Capacidad
                </label>
                <input
                  id="propiedad-capacidad"
                  type="text"
                  inputMode="numeric"
                  value={capacidad}
                  onChange={(evento) => {
                    setCapacidad(evento.target.value);
                    limpiarError("capacidad");
                  }}
                  aria-invalid={errores.capacidad ? true : undefined}
                  aria-describedby={descritoPor(
                    "propiedad-capacidad-ayuda",
                    errores.capacidad ? "propiedad-capacidad-error" : null
                  )}
                  className={`${clasesCampo(Boolean(errores.capacidad))} min-h-11 sm:min-h-10`}
                />
                <p id="propiedad-capacidad-ayuda" className={CLASE_AYUDA}>
                  Cantidad de huéspedes, de {LIMITES_PROPIEDAD.capacidadMin} a{" "}
                  {LIMITES_PROPIEDAD.capacidadMax}.
                </p>
                {errores.capacidad ? (
                  <p id="propiedad-capacidad-error" role="alert" className={CLASE_ERROR}>
                    {errores.capacidad}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="propiedad-orden" className={CLASE_ETIQUETA}>
                  Orden
                </label>
                <input
                  id="propiedad-orden"
                  type="text"
                  inputMode="numeric"
                  value={orden}
                  onChange={(evento) => {
                    setOrden(evento.target.value);
                    limpiarError("orden");
                  }}
                  placeholder="Automático"
                  aria-invalid={errores.orden ? true : undefined}
                  aria-describedby={descritoPor(
                    "propiedad-orden-ayuda",
                    errores.orden ? "propiedad-orden-error" : null
                  )}
                  className={`${clasesCampo(Boolean(errores.orden))} min-h-11 placeholder:text-muted-dark/70 sm:min-h-10`}
                />
                <p id="propiedad-orden-ayuda" className={CLASE_AYUDA}>
                  Dejalo vacío para que quede al final de la lista.
                </p>
                {errores.orden ? (
                  <p id="propiedad-orden-error" role="alert" className={CLASE_ERROR}>
                    {errores.orden}
                  </p>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="propiedad-servicios" className={CLASE_ETIQUETA}>
                  Servicios
                </label>
                <CampoServicios
                  id="propiedad-servicios"
                  valor={servicios}
                  onChange={(nuevosServicios) => {
                    setServicios(nuevosServicios);
                    limpiarError("servicios");
                  }}
                  error={errores.servicios}
                />
              </div>
            </div>
          </section>

          <section
            aria-labelledby="propiedad-fotos"
            className="rounded-md border border-[color:var(--form-panel-border)] bg-[color:var(--form-panel-bg)] p-4 sm:p-5"
          >
            <h4 id="propiedad-fotos" className={CLASE_TITULO_SECCION}>
              <span aria-hidden="true" className={CLASE_BARRA_SECCION} />
              Fotos
            </h4>

            <div className="mt-4">
              <SelectorFotosNuevaPropiedad
                fotos={fotos}
                onChange={setFotos}
                deshabilitado={isPending}
              />
            </div>
          </section>

          <section
            aria-labelledby="propiedad-precios"
            className="rounded-md border border-[color:var(--form-panel-border)] bg-[color:var(--form-panel-bg)] p-4 sm:p-5"
          >
            <h4 id="propiedad-precios" className={CLASE_TITULO_SECCION}>
              <span aria-hidden="true" className={CLASE_BARRA_SECCION} />
              Precios
            </h4>

            <div className="mt-4">
              <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 rounded-sm bg-[color:var(--form-table-head-bg)] px-3 py-2.5 text-xs font-medium text-muted-dark sm:grid">
                <span>Tarifa</span>
                <span>Temporada alta</span>
                <span>Temporada baja</span>
              </div>

              <div className="divide-y divide-[color:var(--form-divider)] sm:mt-1">
                {FILAS_PRECIOS.map((fila) => {
                  const idAlta = IDS_CAMPO[fila.campoAlta];
                  const idBaja = IDS_CAMPO[fila.campoBaja];
                  const errorAlta = errores[fila.campoAlta];
                  const errorBaja = errores[fila.campoBaja];

                  return (
                    <div
                      key={fila.etiqueta}
                      className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] sm:items-start sm:gap-3 sm:px-3 sm:py-3"
                    >
                      <div className="flex flex-wrap items-baseline gap-x-1.5 sm:pt-2.5">
                        <span className="text-[15px] font-semibold text-dark-pine">
                          {fila.etiqueta}
                        </span>
                        <span className="text-xs font-medium text-muted-dark">
                          {fila.detalle}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:contents">
                        <div>
                          <label
                            htmlFor={idAlta}
                            className="mb-1.5 block text-xs font-medium text-muted-dark sm:sr-only"
                          >
                            Temporada alta
                            <span className="sr-only">
                              {" "}
                              — {fila.etiqueta} {fila.detalle}
                            </span>
                          </label>
                          <input
                            id={idAlta}
                            type="text"
                            inputMode="decimal"
                            value={precios[fila.campoAlta]}
                            onChange={(evento) =>
                              actualizarPrecio(fila.campoAlta, evento.target.value)
                            }
                            placeholder={fila.placeholder}
                            aria-invalid={errorAlta ? true : undefined}
                            aria-describedby={descritoPor(
                              "propiedad-precios-ayuda",
                              errorAlta ? `${idAlta}-error` : null
                            )}
                            className={`${clasesCampo(Boolean(errorAlta))} min-h-11 placeholder:text-muted-dark/70 sm:min-h-10`}
                          />
                          {errorAlta ? (
                            <p
                              id={`${idAlta}-error`}
                              role="alert"
                              className={CLASE_ERROR}
                            >
                              {errorAlta}
                            </p>
                          ) : null}
                        </div>

                        <div>
                          <label
                            htmlFor={idBaja}
                            className="mb-1.5 block text-xs font-medium text-muted-dark sm:sr-only"
                          >
                            Temporada baja
                            <span className="sr-only">
                              {" "}
                              — {fila.etiqueta} {fila.detalle}
                            </span>
                          </label>
                          <input
                            id={idBaja}
                            type="text"
                            inputMode="decimal"
                            value={precios[fila.campoBaja]}
                            onChange={(evento) =>
                              actualizarPrecio(fila.campoBaja, evento.target.value)
                            }
                            placeholder={fila.placeholder}
                            aria-invalid={errorBaja ? true : undefined}
                            aria-describedby={descritoPor(
                              "propiedad-precios-ayuda",
                              errorBaja ? `${idBaja}-error` : null
                            )}
                            className={`${clasesCampo(Boolean(errorBaja))} min-h-11 placeholder:text-muted-dark/70 sm:min-h-10`}
                          />
                          {errorBaja ? (
                            <p
                              id={`${idBaja}-error`}
                              role="alert"
                              className={CLASE_ERROR}
                            >
                              {errorBaja}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p id="propiedad-precios-ayuda" className="mt-3 text-xs leading-relaxed text-muted-dark">
              Los precios se cargan en dólares (USD). Podés dejarlos vacíos y
              completarlos después. Usá punto o coma como separador decimal, con
              hasta 2 decimales (por ejemplo 145 o 145,50).
            </p>
          </section>

          <section
            aria-labelledby="propiedad-publicacion"
            className="rounded-md border border-[color:var(--form-panel-border)] bg-[color:var(--form-panel-bg)] p-4 sm:p-5"
          >
            <h4 id="propiedad-publicacion" className={CLASE_TITULO_SECCION}>
              <span aria-hidden="true" className={CLASE_BARRA_SECCION} />
              Publicación
            </h4>

            <label
              htmlFor="propiedad-activa"
              className="mt-4 flex cursor-pointer items-start gap-3"
            >
              <span className="relative mt-0.5 inline-flex h-6 w-11 shrink-0">
                <input
                  id="propiedad-activa"
                  type="checkbox"
                  checked={activa}
                  onChange={(evento) => setActiva(evento.target.checked)}
                  aria-describedby="propiedad-activa-ayuda"
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="h-6 w-11 rounded-full border border-[color:var(--form-field-border-empty)] bg-[color:var(--form-field-bg-empty)] transition-colors peer-checked:border-dark-pine peer-checked:bg-dark-pine peer-focus-visible:ring-2 peer-focus-visible:ring-dark-pine peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-white"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5"
                />
              </span>
              <span>
                <span className="block text-sm font-medium text-dark-pine">
                  Publicar la cabaña en el sitio
                </span>
                <span
                  id="propiedad-activa-ayuda"
                  className="mt-0.5 block text-xs leading-relaxed text-muted-dark"
                >
                  Si no la publicás, no aparece en el inicio, en la pre-reserva ni
                  en el calendario de disponibilidad.
                </span>
              </span>
            </label>
          </section>

          {errorGeneral ? (
            <div
              role="alert"
              className="rounded-md border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger"
            >
              ⚠ {errorGeneral}
            </div>
          ) : null}

          {progresoFotos ? (
            <p
              role="status"
              aria-live="polite"
              className="rounded-md border border-[color:var(--form-panel-border)] bg-white px-4 py-3 text-sm text-dark-pine"
            >
              {progresoFotos}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link href="/admin/propiedades" className={CLASE_BOTON_SECUNDARIO}>
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className={CLASE_BOTON_PRIMARIO}
            >
              {isPending
                ? progresoFotos
                  ? "Subiendo fotos…"
                  : "Creando…"
                : "Crear propiedad"}
            </button>
          </div>
          </fieldset>
        </form>
      )}
    </div>
  );
}

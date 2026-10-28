"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as EventoTecladoReact,
} from "react";

import { eliminarFoto, hacerPortadaFoto } from "@/lib/actions/fotos";
import {
  construirAvisoConfirmacion,
  mensajeResultadoEliminacion,
} from "@/lib/fotos/eliminacion";
import { MENSAJE_PORTADA_OK, mensajeFalloPortada } from "@/lib/fotos/orden";

import { useEliminacion } from "./EliminacionContexto";

const MENSAJE_ERROR_INESPERADO =
  "Ocurrió un error inesperado. Probá de nuevo.";

function opcionesHabilitadas(
  opciones: Array<HTMLButtonElement | null>
): HTMLButtonElement[] {
  return opciones.filter(
    (opcion): opcion is HTMLButtonElement =>
      opcion !== null && opcion.getAttribute("aria-disabled") !== "true"
  );
}

interface BotonEliminarFotoProps {
  propiedadId: string;
  url: string;
  posicion: number;
  total: number;
  etiquetas: {
    compartidaCon: string[];
    enGaleriaExteriores: boolean;
    fijaEnElSitio: boolean;
    externa: boolean;
  };
}

export default function BotonEliminarFoto({
  propiedadId,
  url,
  posicion,
  total,
  etiquetas,
}: BotonEliminarFotoProps) {
  const router = useRouter();
  const { ocupado, setOcupado, publicarAviso, publicarAvisoPortada } =
    useEliminacion();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [cambiandoPortada, setCambiandoPortada] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const disparadorRef = useRef<HTMLButtonElement | null>(null);
  const opcionesRef = useRef<Array<HTMLButtonElement | null>>([]);
  const cancelarRef = useRef<HTMLButtonElement | null>(null);
  const estabaAbierto = useRef(false);

  const idBase = useId();
  const idMenu = `${idBase}-menu`;
  const idTitulo = `${idBase}-titulo`;
  const idDescripcion = `${idBase}-descripcion`;

  const esPortada = posicion === 0;
  const esUltima = total === 1;
  const aviso = construirAvisoConfirmacion({
    esPortada,
    esUltima,
    etiquetas,
  });
  const avisoFuerte = aviso.severidad === "fuerte";

  // El foco inicial va a Cancelar para que un Enter accidental no elimine.
  // Al cerrar la capa, el foco vuelve al botón que la abrió.
  useEffect(() => {
    if (confirmando) {
      estabaAbierto.current = true;
      cancelarRef.current?.focus();
      return;
    }

    if (estabaAbierto.current) {
      estabaAbierto.current = false;
      disparadorRef.current?.focus();
    }
  }, [confirmando]);

  // Menú de opciones: foco inicial en la primera opción, cierre por Escape,
  // por Tab o por un pointerdown fuera del disparador y del menú.
  useEffect(() => {
    if (!menuAbierto) return;

    opcionesHabilitadas(opcionesRef.current)[0]?.focus();

    const manejarPointerDown = (evento: PointerEvent) => {
      const objetivo = evento.target;

      if (!(objetivo instanceof Node)) return;
      if (contenedorRef.current?.contains(objetivo)) return;

      setMenuAbierto(false);
    };

    const manejarTecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        evento.preventDefault();
        setMenuAbierto(false);
        disparadorRef.current?.focus();
        return;
      }

      if (evento.key === "Tab") {
        // El foco vuelve al disparador y el navegador sigue desde ahí con el
        // orden natural, así no se pierde al desmontarse el menú.
        setMenuAbierto(false);
        disparadorRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", manejarPointerDown);
    document.addEventListener("keydown", manejarTecla);

    return () => {
      document.removeEventListener("pointerdown", manejarPointerDown);
      document.removeEventListener("keydown", manejarTecla);
    };
  }, [menuAbierto]);

  useEffect(() => {
    if (!confirmando) return;

    const manejarTecla = (evento: KeyboardEvent) => {
      if (evento.key !== "Escape" || eliminando) return;

      setConfirmando(false);
      setError(null);
    };

    document.addEventListener("keydown", manejarTecla);
    return () => document.removeEventListener("keydown", manejarTecla);
  }, [confirmando, eliminando]);

  const abrirConfirmacion = () => {
    if (ocupado) return;

    setError(null);
    setConfirmando(true);
  };

  const alternarMenu = () => {
    setMenuAbierto((abierto) => !abierto);
  };

  const manejarTecladoMenu = (evento: EventoTecladoReact<HTMLDivElement>) => {
    if (evento.key !== "ArrowDown" && evento.key !== "ArrowUp") return;

    evento.preventDefault();

    const opciones = opcionesHabilitadas(opcionesRef.current);

    if (opciones.length === 0) return;

    const actual = opciones.findIndex(
      (opcion) => opcion === document.activeElement
    );
    const paso = evento.key === "ArrowDown" ? 1 : -1;
    const siguiente =
      actual === -1
        ? 0
        : (actual + paso + opciones.length) % opciones.length;

    opciones[siguiente]?.focus();
  };

  const elegirEliminar = () => {
    setMenuAbierto(false);
    abrirConfirmacion();
  };

  const elegirPortada = async () => {
    if (esPortada || ocupado || cambiandoPortada) return;

    setMenuAbierto(false);
    setCambiandoPortada(true);
    setOcupado(true);

    try {
      const respuesta = await hacerPortadaFoto(propiedadId, url, posicion);

      if (!respuesta.success) {
        publicarAvisoPortada(respuesta.error, "error");

        // Si la lista cambió, se refresca para que se vea el estado real.
        if (respuesta.error === mensajeFalloPortada("desactualizada")) {
          router.refresh();
        }

        return;
      }

      publicarAvisoPortada(MENSAJE_PORTADA_OK, "exito");
      router.refresh();
    } catch {
      // No se muestran detalles internos (tokens, paths ni mensajes del SDK).
      publicarAvisoPortada(MENSAJE_ERROR_INESPERADO, "error");
    } finally {
      setOcupado(false);
      setCambiandoPortada(false);
    }
  };

  const cancelar = () => {
    if (eliminando) return;

    setConfirmando(false);
    setError(null);
  };

  const confirmar = async () => {
    if (eliminando || ocupado) return;

    setEliminando(true);
    setOcupado(true);
    setError(null);

    try {
      const respuesta = await eliminarFoto(propiedadId, url);

      if (!respuesta.success) {
        setError(respuesta.error);
        return;
      }

      publicarAviso(mensajeResultadoEliminacion(respuesta));
      setOcupado(false);
      router.refresh();
    } catch {
      // No se muestran detalles internos (tokens, paths ni mensajes del SDK).
      setError(MENSAJE_ERROR_INESPERADO);
    } finally {
      setOcupado(false);
      setEliminando(false);
    }
  };

  const etiquetaConfirmar = eliminando
    ? "Eliminando…"
    : error
      ? "Reintentar"
      : "Sí, eliminar";

  return (
    <>
      <div ref={contenedorRef}>
        <button
          ref={disparadorRef}
          type="button"
          onClick={alternarMenu}
          disabled={ocupado || confirmando}
          aria-label={`Opciones de la foto ${posicion + 1}`}
          aria-haspopup="menu"
          aria-expanded={menuAbierto}
          aria-controls={idMenu}
          className="absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/85 text-[var(--color-ink)] shadow-sm transition-colors hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
          >
            <circle cx="12" cy="5" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="12" cy="19" r="1.8" />
          </svg>
        </button>

        {menuAbierto && (
          <div
            id={idMenu}
            role="menu"
            aria-label={`Opciones de la foto ${posicion + 1}`}
            onKeyDown={manejarTecladoMenu}
            className="absolute right-2 top-12 z-30 min-w-32 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-lg sm:min-w-40"
          >
            {/* Para sumar una opción nueva, agregar otro botón hermano con role="menuitem". */}
            <button
              ref={(elemento) => {
                opcionesRef.current[0] = elemento;
              }}
              type="button"
              role="menuitem"
              aria-disabled={esPortada || undefined}
              onClick={elegirPortada}
              className={`flex w-full items-center rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-inset ${
                esPortada
                  ? "cursor-not-allowed text-[var(--color-ink)]/40"
                  : "text-[var(--color-ink)] hover:bg-[var(--color-warm)]/20 focus-visible:bg-[var(--color-warm)]/20"
              }`}
            >
              Hacer portada
            </button>

            <button
              ref={(elemento) => {
                opcionesRef.current[1] = elemento;
              }}
              type="button"
              role="menuitem"
              onClick={elegirEliminar}
              className="flex w-full items-center rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm font-medium text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger-bg)] focus-visible:bg-[var(--color-danger-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-inset"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>

      {confirmando && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={idTitulo}
          aria-describedby={idDescripcion}
          className={`absolute inset-0 z-20 flex flex-col gap-2 overflow-y-auto border bg-[var(--color-surface)] p-3 ${
            avisoFuerte
              ? "border-[var(--color-danger)]"
              : "border-[var(--color-border)]"
          }`}
        >
          <h3
            id={idTitulo}
            className={`text-sm font-semibold ${
              avisoFuerte
                ? "text-[var(--color-danger)]"
                : "text-[var(--color-ink)]"
            }`}
          >
            {aviso.titulo}
          </h3>

          <div
            id={idDescripcion}
            className="space-y-1 text-xs leading-relaxed text-[var(--color-ink)]/75"
          >
            {aviso.lineas.map((linea, indice) => (
              <p key={indice}>{linea}</p>
            ))}
          </div>

          {error && (
            <p
              role="alert"
              className="text-xs font-medium text-[var(--color-danger)]"
            >
              {error}
            </p>
          )}

          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            <button
              ref={cancelarRef}
              type="button"
              onClick={cancelar}
              disabled={eliminando}
              className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)]/75 transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={confirmar}
              disabled={eliminando || ocupado}
              className="rounded-[var(--radius-sm)] bg-[var(--color-danger)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {etiquetaConfirmar}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

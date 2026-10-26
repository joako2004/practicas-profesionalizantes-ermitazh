"use client";

import { useRouter } from "next/navigation";
import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";

import { prepararSubidaFoto, registrarFoto } from "@/lib/actions/fotos";
import { BUCKET_FOTOS, MAX_ARCHIVOS_POR_TANDA } from "@/lib/fotos/rutas";
import {
  actualizarEstado,
  claveArchivo,
  incorporarArchivos,
  itemsSubibles,
  quitarItem,
  resumenTanda,
  type ArchivoRechazado,
  type CandidatoArchivo,
  type EstadoSubida,
  type ItemSubida,
} from "@/lib/fotos/subida";
import { createClient } from "@/lib/supabase/client";

const ID_PANEL = "subida-fotos-panel";

const MENSAJE_ERROR_SUBIDA = "No se pudo subir el archivo. Probá de nuevo.";
const MENSAJE_ERROR_INESPERADO =
  "Ocurrió un error inesperado. Probá de nuevo.";

interface SubidaFotosProps {
  propiedadId: string;
}

function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;

  return `${(kb / 1024).toFixed(2)} MB`;
}

function textoEstado(item: ItemSubida): string {
  switch (item.estado) {
    case "pendiente":
      return "Esperando";
    case "subiendo":
      return "Subiendo…";
    case "listo":
      return "Lista ✓";
    default:
      return item.error ?? "No se pudo subir la foto.";
  }
}

function clasesEstado(estado: EstadoSubida): string {
  switch (estado) {
    case "listo":
      return "text-[var(--color-success)]";
    case "error":
      return "text-[var(--color-danger)]";
    case "subiendo":
      return "text-[var(--color-accent)]";
    default:
      return "text-[var(--color-ink)]/60";
  }
}

function armarResumen(items: ItemSubida[]): string {
  const { total, listos, conError } = resumenTanda(items);
  const fotos = total === 1 ? "foto" : "fotos";

  if (listos === 0) {
    return conError === 1
      ? "No se pudo subir la foto. Podés reintentarla."
      : `No se pudo subir ninguna de las ${total} fotos. Podés reintentarlas.`;
  }

  const base = `Se ${listos === 1 ? "subió" : "subieron"} ${listos} de ${total} ${fotos}.`;

  if (conError === 0) return base;

  return conError === 1
    ? `${base} 1 tuvo errores: podés reintentarla.`
    : `${base} ${conError} tuvieron errores: podés reintentarlas.`;
}

export default function SubidaFotos({ propiedadId }: SubidaFotosProps) {
  const router = useRouter();

  const [abierto, setAbierto] = useState(false);
  const [items, setItems] = useState<ItemSubida[]>([]);
  const [rechazados, setRechazados] = useState<ArchivoRechazado[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const [enCurso, setEnCurso] = useState(false);
  const [resumen, setResumen] = useState<string | null>(null);

  const itemsRef = useRef<ItemSubida[]>([]);
  const archivosRef = useRef<Map<string, File>>(new Map());
  const inputRef = useRef<HTMLInputElement | null>(null);
  const contadorArrastre = useRef(0);

  const reemplazarItems = (nuevos: ItemSubida[]) => {
    itemsRef.current = nuevos;
    setItems(nuevos);
  };

  const alternarPanel = () => {
    if (enCurso) return;
    setAbierto((valor) => !valor);
  };

  const abrirSelector = () => {
    if (enCurso) return;
    inputRef.current?.click();
  };

  const agregarArchivos = (archivos: File[]) => {
    if (enCurso || archivos.length === 0) return;

    const nuevosCandidatos: CandidatoArchivo[] = archivos.map((archivo) => ({
      nombre: archivo.name,
      tipo: archivo.type,
      tamano: archivo.size,
      ultimaModificacion: archivo.lastModified,
    }));

    const previos = itemsRef.current;
    const { items: nuevosItems, rechazados: nuevosRechazados } =
      incorporarArchivos(previos, nuevosCandidatos, MAX_ARCHIVOS_POR_TANDA);

    const clavesPrevias = new Set(previos.map((item) => item.clave));
    const archivosPorClave = new Map<string, File>();
    nuevosCandidatos.forEach((candidato, indice) => {
      archivosPorClave.set(claveArchivo(candidato), archivos[indice]);
    });

    for (const item of nuevosItems) {
      if (clavesPrevias.has(item.clave)) continue;

      const archivo = archivosPorClave.get(item.clave);
      if (archivo) archivosRef.current.set(item.clave, archivo);
    }

    reemplazarItems(nuevosItems);
    setRechazados(nuevosRechazados);
  };

  const manejarSeleccion = (evento: ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(evento.currentTarget.files ?? []);
    // Se reinicia para poder volver a elegir el mismo archivo.
    evento.currentTarget.value = "";
    agregarArchivos(archivos);
  };

  const manejarTecla = (evento: KeyboardEvent<HTMLDivElement>) => {
    if (evento.key !== "Enter" && evento.key !== " ") return;

    evento.preventDefault();
    abrirSelector();
  };

  const manejarDragEnter = (evento: DragEvent<HTMLDivElement>) => {
    evento.preventDefault();
    if (enCurso) return;

    contadorArrastre.current += 1;
    setArrastrando(true);
  };

  const manejarDragOver = (evento: DragEvent<HTMLDivElement>) => {
    // Sin esto el navegador abre la foto soltada en lugar de subirla.
    evento.preventDefault();
  };

  const manejarDragLeave = (evento: DragEvent<HTMLDivElement>) => {
    evento.preventDefault();
    if (enCurso) return;

    contadorArrastre.current = Math.max(0, contadorArrastre.current - 1);
    if (contadorArrastre.current === 0) setArrastrando(false);
  };

  const manejarDrop = (evento: DragEvent<HTMLDivElement>) => {
    evento.preventDefault();
    contadorArrastre.current = 0;
    setArrastrando(false);

    if (enCurso) return;

    const archivos = Array.from(evento.dataTransfer.files);
    if (archivos.length === 0) return;

    agregarArchivos(archivos);
  };

  const quitar = (clave: string) => {
    if (enCurso) return;

    archivosRef.current.delete(clave);
    reemplazarItems(quitarItem(itemsRef.current, clave));
    setResumen(null);
  };

  const limpiarLista = () => {
    if (enCurso) return;

    for (const item of itemsRef.current) {
      if (item.estado === "listo") archivosRef.current.delete(item.clave);
    }

    reemplazarItems(
      itemsRef.current.filter((item) => item.estado !== "listo")
    );
    setResumen(null);
  };

  const subir = async () => {
    if (enCurso) return;

    const subibles = itemsSubibles(itemsRef.current);
    if (subibles.length === 0) return;

    setEnCurso(true);
    setResumen(null);

    let siguiente = itemsRef.current;
    let huboListos = false;

    // Secuencial a propósito: una subida por vez, sin saturar el almacén.
    for (const item of subibles) {
      const archivo = archivosRef.current.get(item.clave);

      if (!archivo) {
        siguiente = actualizarEstado(
          siguiente,
          item.clave,
          "error",
          MENSAJE_ERROR_INESPERADO
        );
        reemplazarItems(siguiente);
        continue;
      }

      siguiente = actualizarEstado(siguiente, item.clave, "subiendo");
      reemplazarItems(siguiente);

      try {
        const preparada = await prepararSubidaFoto(propiedadId, {
          nombre: item.nombre,
          tipo: item.tipo,
          tamano: item.tamano,
        });

        if (!preparada.success) {
          siguiente = actualizarEstado(
            siguiente,
            item.clave,
            "error",
            preparada.error
          );
          reemplazarItems(siguiente);
          continue;
        }

        const supabase = createClient();
        const { error } = await supabase.storage
          .from(BUCKET_FOTOS)
          .uploadToSignedUrl(preparada.path, preparada.token, archivo, {
            contentType: archivo.type,
          });

        if (error) {
          siguiente = actualizarEstado(
            siguiente,
            item.clave,
            "error",
            MENSAJE_ERROR_SUBIDA
          );
          reemplazarItems(siguiente);
          continue;
        }

        const registrada = await registrarFoto(propiedadId, preparada.path);

        if (!registrada.success) {
          siguiente = actualizarEstado(
            siguiente,
            item.clave,
            "error",
            registrada.error
          );
          reemplazarItems(siguiente);
          continue;
        }

        siguiente = actualizarEstado(siguiente, item.clave, "listo");
        reemplazarItems(siguiente);
        huboListos = true;
      } catch {
        // No se muestran detalles internos (tokens, paths ni mensajes del SDK).
        siguiente = actualizarEstado(
          siguiente,
          item.clave,
          "error",
          MENSAJE_ERROR_INESPERADO
        );
        reemplazarItems(siguiente);
      }
    }

    setEnCurso(false);
    setResumen(armarResumen(siguiente));

    if (huboListos) router.refresh();
  };

  const cantidadSubible = itemsSubibles(items).length;
  const hayListos = items.some((item) => item.estado === "listo");
  const bloqueada = enCurso;

  const clasesZona = [
    "flex flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border-2 border-dashed px-4 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
    bloqueada
      ? "cursor-not-allowed border-[var(--color-border)] bg-[var(--color-surface)] opacity-50"
      : arrastrando
        ? "cursor-pointer border-[var(--color-accent)] bg-[var(--color-accent)]/10"
        : "cursor-pointer border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-warm)]/20",
  ].join(" ");

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={alternarPanel}
        aria-expanded={abierto}
        aria-controls={ID_PANEL}
        className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
      >
        Agregar fotos
        <span aria-hidden="true">{abierto ? "▴" : "▾"}</span>
      </button>

      <div
        id={ID_PANEL}
        hidden={!abierto}
        className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
      >
        <div
          role="button"
          tabIndex={0}
          aria-label="Arrastrá tus fotos acá o tocá para elegirlas"
          aria-disabled={bloqueada}
          onClick={abrirSelector}
          onKeyDown={manejarTecla}
          onDragEnter={manejarDragEnter}
          onDragOver={manejarDragOver}
          onDragLeave={manejarDragLeave}
          onDrop={manejarDrop}
          className={clasesZona}
        >
          <p className="text-sm font-medium text-[var(--color-ink)]">
            Arrastrá tus fotos acá o tocá para elegirlas
          </p>
          <p className="text-xs text-[var(--color-ink)]/60">
            JPG, PNG o WebP · hasta 5 MB cada una · máximo 10 por tanda
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          hidden
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={manejarSeleccion}
        />

        {rechazados.length > 0 && (
          <div
            aria-live="polite"
            className="rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-4 py-3 text-sm text-[var(--color-ink)]"
          >
            <p className="font-medium">Archivos rechazados</p>
            <ul className="mt-1 space-y-1">
              {rechazados.map((rechazo, indice) => (
                <li key={`${rechazo.nombre}-${indice}`}>
                  {rechazo.nombre}: {rechazo.motivo}
                </li>
              ))}
            </ul>
          </div>
        )}

        {items.length > 0 && (
          <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
            {items.map((item) => (
              <li
                key={item.clave}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p
                    className="truncate font-medium text-[var(--color-ink)]"
                    title={item.nombre}
                  >
                    {item.nombre}
                  </p>
                  <p className="text-xs text-[var(--color-ink)]/60">
                    {formatearTamano(item.tamano)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-sm ${clasesEstado(item.estado)}`}>
                    {textoEstado(item)}
                  </span>

                  {(item.estado === "pendiente" ||
                    item.estado === "error") && (
                    <button
                      type="button"
                      onClick={() => quitar(item.clave)}
                      disabled={enCurso}
                      className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 py-1 text-xs font-medium text-[var(--color-ink)]/70 transition-colors hover:border-[var(--color-danger-border)] hover:text-[var(--color-danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={subir}
            disabled={cantidadSubible === 0 || enCurso}
            className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {`Subir ${cantidadSubible} ${
              cantidadSubible === 1 ? "foto" : "fotos"
            }`}
          </button>

          {hayListos && !enCurso && (
            <button
              type="button"
              onClick={limpiarLista}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ink)]/70 transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              Limpiar lista
            </button>
          )}
        </div>

        {resumen && (
          <p
            aria-live="polite"
            className="text-sm text-[var(--color-ink)]/75"
          >
            {resumen}
          </p>
        )}

        <p className="text-xs text-[var(--color-ink)]/60">
          Las fotos nuevas se agregan al final del álbum. La portada es siempre
          la primera foto.
        </p>
      </div>
    </div>
  );
}

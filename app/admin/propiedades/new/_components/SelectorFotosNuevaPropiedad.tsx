"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";

import {
  MAX_ARCHIVOS_POR_TANDA,
  TAMANO_MAXIMO_BYTES,
  TIPOS_MIME_PERMITIDOS,
} from "@/lib/fotos/rutas";
import {
  claveArchivo,
  incorporarArchivos,
  type ArchivoRechazado,
  type CandidatoArchivo,
  type ItemSubida,
} from "@/lib/fotos/subida";

export interface FotoSeleccionada {
  item: ItemSubida;
  archivo: File;
  urlMiniatura: string;
}

interface SelectorFotosNuevaPropiedadProps {
  fotos: FotoSeleccionada[];
  onChange: (fotos: FotoSeleccionada[]) => void;
  deshabilitado: boolean;
}

const TAMANO_MAXIMO_MB = TAMANO_MAXIMO_BYTES / (1024 * 1024);

const TIPOS_VISIBLES = TIPOS_MIME_PERMITIDOS.map((tipo) =>
  tipo.replace("image/", "")
).join(", ");

const CLASE_BOTON_QUITAR =
  "inline-flex min-h-11 shrink-0 items-center justify-center rounded-sm border border-[color:var(--form-field-border)] bg-white px-3 text-xs font-semibold text-dark-pine transition-colors hover:border-[color:var(--form-field-border-hover)] hover:bg-[color:var(--form-field-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-pine focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:border-[color:var(--form-disabled-border)] disabled:bg-[color:var(--form-disabled-bg)] disabled:text-muted-dark sm:min-h-10";

export function liberarMiniaturas(fotos: readonly FotoSeleccionada[]): void {
  for (const foto of fotos) {
    URL.revokeObjectURL(foto.urlMiniatura);
  }
}

export default function SelectorFotosNuevaPropiedad({
  fotos,
  onChange,
  deshabilitado,
}: SelectorFotosNuevaPropiedadProps) {
  const [rechazados, setRechazados] = useState<ArchivoRechazado[]>([]);
  const [arrastrando, setArrastrando] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const contadorArrastre = useRef(0);
  const urlsCreadas = useRef<Set<string>>(new Set());

  useEffect(() => {
    const urls = urlsCreadas.current;
    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
      urls.clear();
    };
  }, []);

  const abrirSelector = (): void => {
    if (deshabilitado) return;
    inputRef.current?.click();
  };

  const agregarArchivos = (archivos: File[]): void => {
    if (deshabilitado || archivos.length === 0) return;

    const candidatos: CandidatoArchivo[] = archivos.map((archivo) => ({
      nombre: archivo.name,
      tipo: archivo.type,
      tamano: archivo.size,
      ultimaModificacion: archivo.lastModified,
    }));

    const { items: nuevosItems, rechazados: nuevosRechazados } =
      incorporarArchivos(
        fotos.map((foto) => foto.item),
        candidatos,
        MAX_ARCHIVOS_POR_TANDA
      );

    const clavesPrevias = new Set(fotos.map((foto) => foto.item.clave));
    const archivosPorClave = new Map<string, File>();
    candidatos.forEach((candidato, indice) => {
      archivosPorClave.set(claveArchivo(candidato), archivos[indice]);
    });

    const nuevas: FotoSeleccionada[] = [];
    for (const item of nuevosItems) {
      if (clavesPrevias.has(item.clave)) continue;

      const archivo = archivosPorClave.get(item.clave);
      if (!archivo) continue;

      const urlMiniatura = URL.createObjectURL(archivo);
      urlsCreadas.current.add(urlMiniatura);
      nuevas.push({ item, archivo, urlMiniatura });
    }

    onChange([...fotos, ...nuevas]);
    setRechazados(nuevosRechazados);
  };

  const manejarSeleccion = (evento: ChangeEvent<HTMLInputElement>): void => {
    const archivos = Array.from(evento.currentTarget.files ?? []);
    // Se reinicia para poder volver a elegir el mismo archivo.
    evento.currentTarget.value = "";
    agregarArchivos(archivos);
  };

  const manejarTecla = (evento: KeyboardEvent<HTMLDivElement>): void => {
    if (evento.key !== "Enter" && evento.key !== " ") return;

    evento.preventDefault();
    abrirSelector();
  };

  const manejarDragEnter = (evento: DragEvent<HTMLDivElement>): void => {
    evento.preventDefault();
    if (deshabilitado) return;

    contadorArrastre.current += 1;
    setArrastrando(true);
  };

  const manejarDragOver = (evento: DragEvent<HTMLDivElement>): void => {
    // Sin esto el navegador abre la foto soltada en lugar de elegirla.
    evento.preventDefault();
  };

  const manejarDragLeave = (evento: DragEvent<HTMLDivElement>): void => {
    evento.preventDefault();
    if (deshabilitado) return;

    contadorArrastre.current = Math.max(0, contadorArrastre.current - 1);
    if (contadorArrastre.current === 0) setArrastrando(false);
  };

  const manejarDrop = (evento: DragEvent<HTMLDivElement>): void => {
    evento.preventDefault();
    contadorArrastre.current = 0;
    setArrastrando(false);

    if (deshabilitado) return;

    const archivos = Array.from(evento.dataTransfer.files);
    if (archivos.length === 0) return;

    agregarArchivos(archivos);
  };

  const quitar = (clave: string): void => {
    if (deshabilitado) return;

    const foto = fotos.find((item) => item.item.clave === clave);
    if (foto) {
      URL.revokeObjectURL(foto.urlMiniatura);
      urlsCreadas.current.delete(foto.urlMiniatura);
    }

    onChange(fotos.filter((item) => item.item.clave !== clave));
  };

  const clasesZona = [
    "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-sm border-2 border-dashed px-4 py-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-pine focus-visible:ring-offset-2 focus-visible:ring-offset-white",
    deshabilitado
      ? "cursor-not-allowed border-[color:var(--form-disabled-border)] bg-[color:var(--form-disabled-bg)] opacity-60"
      : arrastrando
        ? "border-dark-pine bg-[color:var(--form-field-hover-bg)]"
        : "border-[color:var(--form-field-border-empty)] bg-white hover:border-[color:var(--form-field-border-hover)] hover:bg-[color:var(--form-field-hover-bg)]",
  ].join(" ");

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Arrastrá tus fotos acá o tocá para elegirlas"
        aria-disabled={deshabilitado}
        aria-describedby="propiedad-fotos-ayuda"
        onClick={abrirSelector}
        onKeyDown={manejarTecla}
        onDragEnter={manejarDragEnter}
        onDragOver={manejarDragOver}
        onDragLeave={manejarDragLeave}
        onDrop={manejarDrop}
        className={clasesZona}
      >
        <p className="text-sm font-medium text-dark-pine">
          Arrastrá tus fotos acá o tocá para elegirlas
        </p>
        <p className="text-xs text-muted-dark">
          {TIPOS_VISIBLES} · hasta {TAMANO_MAXIMO_MB} MiB cada una · máximo{" "}
          {MAX_ARCHIVOS_POR_TANDA} por tanda
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        hidden
        multiple
        accept={TIPOS_MIME_PERMITIDOS.join(",")}
        onChange={manejarSeleccion}
        disabled={deshabilitado}
      />

      <div className="mt-1.5 flex items-start justify-between gap-3">
        <p
          id="propiedad-fotos-ayuda"
          className="text-xs leading-relaxed text-muted-dark"
        >
          Opcional. La primera será la portada.
        </p>
        <span
          className={`shrink-0 text-xs tabular-nums ${
            fotos.length >= MAX_ARCHIVOS_POR_TANDA
              ? "font-medium text-[#573c00]"
              : "text-muted-dark"
          }`}
        >
          {fotos.length}/{MAX_ARCHIVOS_POR_TANDA}
        </span>
      </div>

      {rechazados.length > 0 ? (
        <div
          aria-live="polite"
          className="mt-3 rounded-sm border border-warning-border bg-warning-bg px-3 py-2.5 text-xs text-dark-pine"
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
      ) : null}

      {fotos.length > 0 ? (
        <ul
          aria-label="Fotos elegidas"
          className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          {fotos.map((foto, indice) => (
            <li
              key={foto.item.clave}
              className="flex items-center gap-3 rounded-sm border border-[color:var(--form-panel-border)] bg-white p-2"
            >
              <Image
                src={foto.urlMiniatura}
                alt=""
                width={56}
                height={56}
                unoptimized
                className="h-14 w-14 shrink-0 rounded-sm border border-[color:var(--form-panel-border)] object-cover"
              />
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-medium text-dark-pine"
                  title={foto.item.nombre}
                >
                  {foto.item.nombre}
                </p>
                {indice === 0 ? (
                  <span className="mt-0.5 inline-flex rounded-full border border-desert-sand/60 bg-[color:var(--form-panel-bg)] px-2 py-0.5 text-[11px] font-medium text-dark-pine">
                    Portada
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => quitar(foto.item.clave)}
                disabled={deshabilitado}
                aria-label={`Quitar ${foto.item.nombre}`}
                className={CLASE_BOTON_QUITAR}
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

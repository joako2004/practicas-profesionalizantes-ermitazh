"use client";

import type { EtiquetasFoto } from "@/lib/fotos/etiquetas";

import {
  AvisoEliminacion,
  ProveedorEliminacion,
} from "@/app/admin/fotos/_components/EliminacionContexto";
import GaleriaFotos from "@/app/admin/fotos/_components/GaleriaFotos";
import SubidaFotos from "@/app/admin/fotos/_components/SubidaFotos";

export interface FotoConEtiquetas {
  url: string;
  etiquetas: EtiquetasFoto;
}

interface SeccionFotosPropiedadProps {
  propiedadId: string;
  nombreCabana: string;
  fotos: FotoConEtiquetas[];
}

/**
 * Sección FOTOS de la tarjeta de /admin/propiedades.
 *
 * Compone los mismos componentes de /admin/fotos para no duplicar la subida,
 * la galería, el menú de opciones ni el visor. Las etiquetas vienen calculadas
 * del servidor porque dependen de todas las cabañas y de las imágenes del sitio.
 */
export default function SeccionFotosPropiedad({
  propiedadId,
  nombreCabana,
  fotos,
}: SeccionFotosPropiedadProps) {
  return (
    <section className="rounded-md border border-[color:var(--prop-panel-border)] bg-[color:var(--prop-panel-bg)] p-4 sm:p-5">
      <h4 className="flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-dark-pine">
        <span
          aria-hidden="true"
          className="h-4 w-[2px] shrink-0 rounded-full bg-dark-pine"
        />
        Fotos
      </h4>

      <div className="mt-4 space-y-4">
        <SubidaFotos propiedadId={propiedadId} />

        <ProveedorEliminacion>
          <AvisoEliminacion />
          <GaleriaFotos
            propiedadId={propiedadId}
            nombreCabana={nombreCabana}
            fotos={fotos}
          />
        </ProveedorEliminacion>
      </div>
    </section>
  );
}

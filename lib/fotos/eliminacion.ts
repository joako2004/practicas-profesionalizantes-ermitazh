/**
 * Textos de la eliminación de fotos del panel de administración.
 *
 * Este módulo es puro: no importa React, Node, Prisma, Supabase ni lee
 * process.env. Recibe las etiquetas calculadas al renderizar y arma la
 * confirmación; el resultado real siempre lo decide el servidor.
 */

import type { MotivoConservacion } from "./referencias";

export type ContextoEliminacion = {
  esPortada: boolean;
  esUltima: boolean;
  etiquetas: {
    compartidaCon: string[];
    enGaleriaExteriores: boolean;
    fijaEnElSitio: boolean;
    externa: boolean;
  };
};

export type AvisoConfirmacion = {
  titulo: string;
  lineas: string[];
  severidad: "normal" | "fuerte";
};

export type ResultadoEliminacionOk = {
  archivoBorrado: boolean;
  motivoConservacion?: MotivoConservacion;
  advertencia?: string;
};

export type MensajePostEliminacion = {
  texto: string;
  advertencia?: string;
};

const TITULO_CONFIRMACION = "¿Eliminar esta foto?";

const LINEA_EXTERNA =
  "Es un enlace externo: el panel no puede eliminar este tipo de foto, así que se conservará en esta cabaña.";
const LINEA_FIJA =
  "Se quitará de esta cabaña. El archivo se conserva porque el sitio lo usa (inicio, login o panel).";
const LINEA_GALERIA =
  "Se quitará de esta cabaña. El archivo se conserva porque figura en la galería de exteriores.";
const LINEA_BORRADO =
  "Se quitará de esta cabaña y el archivo se borrará definitivamente del almacén. No se puede deshacer.";

const LINEA_PORTADA =
  "Es la portada: la siguiente foto pasará a ser la portada.";
const LINEA_ULTIMA =
  "Es la última foto: la cabaña quedará sin imágenes y su tarjeta del inicio se verá vacía.";

const FRASE_MOTIVO: Record<MotivoConservacion, string> = {
  protegida: " El archivo se conserva porque el sitio lo usa.",
  "otra-propiedad": " El archivo se conserva porque otra cabaña lo usa.",
  imagenes: " El archivo se conserva porque figura en la galería de exteriores.",
};

/**
 * Une nombres con comas y "y" antes del último: "A, B y C".
 */
function unirNombres(nombres: readonly string[]): string {
  if (nombres.length <= 1) return nombres.join("");

  return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}

/**
 * Arma la confirmación previa con las etiquetas calculadas al renderizar.
 *
 * El orden de la línea de efecto sigue al de decidirBorradoArchivo: primero
 * lo fijo en el sitio, después las otras cabañas y por último la galería de
 * exteriores. Si nada de eso aplica, el archivo se borra.
 */
export function construirAvisoConfirmacion(
  ctx: ContextoEliminacion
): AvisoConfirmacion {
  const { esPortada, esUltima, etiquetas } = ctx;

  let lineaEfecto: string;

  if (etiquetas.externa) {
    lineaEfecto = LINEA_EXTERNA;
  } else if (etiquetas.fijaEnElSitio) {
    lineaEfecto = LINEA_FIJA;
  } else if (etiquetas.compartidaCon.length === 1) {
    lineaEfecto = `Se quitará de esta cabaña. El archivo se conserva porque la cabaña ${etiquetas.compartidaCon[0]} también lo usa.`;
  } else if (etiquetas.compartidaCon.length >= 2) {
    lineaEfecto = `Se quitará de esta cabaña. El archivo se conserva porque las cabañas ${unirNombres(
      etiquetas.compartidaCon
    )} también lo usan.`;
  } else if (etiquetas.enGaleriaExteriores) {
    lineaEfecto = LINEA_GALERIA;
  } else {
    lineaEfecto = LINEA_BORRADO;
  }

  const lineas = [lineaEfecto];

  if (esPortada && !esUltima) {
    lineas.push(LINEA_PORTADA);
  }

  if (esUltima) {
    lineas.push(LINEA_ULTIMA);
  }

  return {
    titulo: TITULO_CONFIRMACION,
    lineas,
    severidad: esUltima ? "fuerte" : "normal",
  };
}

/**
 * Arma el cartel posterior con la respuesta real de eliminarFoto.
 *
 * La advertencia del servidor se muestra tal cual, sin reescribirla.
 */
export function mensajeResultadoEliminacion(
  r: ResultadoEliminacionOk
): MensajePostEliminacion {
  let texto: string;

  if (r.archivoBorrado) {
    texto = "Foto eliminada. El archivo también se borró del almacén.";
  } else {
    texto = "Foto quitada de esta cabaña.";

    if (r.motivoConservacion) {
      texto += FRASE_MOTIVO[r.motivoConservacion];
    }
  }

  if (r.advertencia) {
    return { texto, advertencia: r.advertencia };
  }

  return { texto };
}

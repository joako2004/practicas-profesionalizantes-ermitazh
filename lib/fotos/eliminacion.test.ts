import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  construirAvisoConfirmacion,
  mensajeResultadoEliminacion,
  type ContextoEliminacion,
} from "./eliminacion";

const TITULO = "¿Eliminar esta foto?";
const LINEA_BORRADO =
  "Se quitará de esta cabaña y el archivo se borrará definitivamente del almacén. No se puede deshacer.";
const LINEA_FIJA =
  "Se quitará de esta cabaña. El archivo se conserva porque el sitio lo usa (inicio, login o panel).";
const LINEA_GALERIA =
  "Se quitará de esta cabaña. El archivo se conserva porque figura en la galería de exteriores.";
const LINEA_EXTERNA =
  "Es un enlace externo: se quitará de esta cabaña. No se borra ningún archivo, pero tampoco se puede volver a agregar desde el panel.";
const LINEA_PORTADA =
  "Es la portada: la siguiente foto pasará a ser la portada.";
const LINEA_ULTIMA =
  "Es la última foto: la cabaña quedará sin imágenes y su tarjeta del inicio se verá vacía.";

function etiquetas(
  parcial: Partial<ContextoEliminacion["etiquetas"]> = {}
): ContextoEliminacion["etiquetas"] {
  return {
    compartidaCon: [],
    enGaleriaExteriores: false,
    fijaEnElSitio: false,
    externa: false,
    ...parcial,
  };
}

function contexto(
  parcial: Partial<ContextoEliminacion> = {}
): ContextoEliminacion {
  return {
    esPortada: false,
    esUltima: false,
    etiquetas: etiquetas(),
    ...parcial,
  };
}

describe("construirAvisoConfirmacion", () => {
  it("avisa que un enlace externo no se puede eliminar", () => {
    const aviso = construirAvisoConfirmacion(
      contexto({ etiquetas: etiquetas({ externa: true }) })
    );

    assert.deepEqual(aviso, {
      titulo: TITULO,
      lineas: [LINEA_EXTERNA],
      severidad: "normal",
    });
  });

  it("conserva el archivo cuando está fijo en el sitio", () => {
    const aviso = construirAvisoConfirmacion(
      contexto({ etiquetas: etiquetas({ fijaEnElSitio: true }) })
    );

    assert.deepEqual(aviso.lineas, [LINEA_FIJA]);
  });

  it("nombra a la única cabaña que comparte el archivo", () => {
    const aviso = construirAvisoConfirmacion(
      contexto({
        etiquetas: etiquetas({ compartidaCon: ["Cabaña Uno"] }),
      })
    );

    assert.deepEqual(aviso.lineas, [
      "Se quitará de esta cabaña. El archivo se conserva porque la cabaña Cabaña Uno también lo usa.",
    ]);
  });

  it("une dos cabañas con y", () => {
    const aviso = construirAvisoConfirmacion(
      contexto({
        etiquetas: etiquetas({ compartidaCon: ["Cabaña Uno", "Cabaña Dos"] }),
      })
    );

    assert.deepEqual(aviso.lineas, [
      "Se quitará de esta cabaña. El archivo se conserva porque las cabañas Cabaña Uno y Cabaña Dos también lo usan.",
    ]);
  });

  it("une tres cabañas con comas y y antes de la última", () => {
    const aviso = construirAvisoConfirmacion(
      contexto({
        etiquetas: etiquetas({
          compartidaCon: ["Cabaña Uno", "Cabaña Dos", "Cabaña Tres"],
        }),
      })
    );

    assert.deepEqual(aviso.lineas, [
      "Se quitará de esta cabaña. El archivo se conserva porque las cabañas Cabaña Uno, Cabaña Dos y Cabaña Tres también lo usan.",
    ]);
  });

  it("conserva el archivo cuando figura en la galería de exteriores", () => {
    const aviso = construirAvisoConfirmacion(
      contexto({ etiquetas: etiquetas({ enGaleriaExteriores: true }) })
    );

    assert.deepEqual(aviso.lineas, [LINEA_GALERIA]);
  });

  it("avisa que el archivo se borra cuando no hay otras referencias", () => {
    const aviso = construirAvisoConfirmacion(contexto());

    assert.deepEqual(aviso, {
      titulo: TITULO,
      lineas: [LINEA_BORRADO],
      severidad: "normal",
    });
  });
});

describe("construirAvisoConfirmacion: precedencia", () => {
  it("fija en el sitio gana sobre compartida y galería", () => {
    const aviso = construirAvisoConfirmacion(
      contexto({
        etiquetas: etiquetas({
          compartidaCon: ["Cabaña Uno", "Cabaña Dos"],
          enGaleriaExteriores: true,
          fijaEnElSitio: true,
        }),
      })
    );

    assert.deepEqual(aviso.lineas, [LINEA_FIJA]);
  });

  it("compartida gana sobre galería", () => {
    const aviso = construirAvisoConfirmacion(
      contexto({
        etiquetas: etiquetas({
          compartidaCon: ["Cabaña Uno"],
          enGaleriaExteriores: true,
        }),
      })
    );

    assert.deepEqual(aviso.lineas, [
      "Se quitará de esta cabaña. El archivo se conserva porque la cabaña Cabaña Uno también lo usa.",
    ]);
  });

  it("externa gana sobre cualquier otra etiqueta", () => {
    const aviso = construirAvisoConfirmacion(
      contexto({
        etiquetas: etiquetas({
          externa: true,
          fijaEnElSitio: true,
          compartidaCon: ["Cabaña Uno"],
          enGaleriaExteriores: true,
        }),
      })
    );

    assert.deepEqual(aviso.lineas, [LINEA_EXTERNA]);
  });

  it("fija en el sitio gana sobre galería", () => {
    const aviso = construirAvisoConfirmacion(
      contexto({
        etiquetas: etiquetas({
          enGaleriaExteriores: true,
          fijaEnElSitio: true,
        }),
      })
    );

    assert.deepEqual(aviso.lineas, [LINEA_FIJA]);
  });
});

describe("construirAvisoConfirmacion: portada y última foto", () => {
  it("agrega la línea de portada cuando quedan más fotos", () => {
    const aviso = construirAvisoConfirmacion(
      contexto({ esPortada: true, esUltima: false })
    );

    assert.deepEqual(aviso.lineas, [LINEA_BORRADO, LINEA_PORTADA]);
    assert.equal(aviso.severidad, "normal");
  });

  it("con portada y última muestra solo la línea de última y severidad fuerte", () => {
    const aviso = construirAvisoConfirmacion(
      contexto({ esPortada: true, esUltima: true })
    );

    assert.deepEqual(aviso.lineas, [LINEA_BORRADO, LINEA_ULTIMA]);
    assert.equal(aviso.severidad, "fuerte");
  });

  it("con una foto del medio deja una sola línea y severidad normal", () => {
    const aviso = construirAvisoConfirmacion(
      contexto({ esPortada: false, esUltima: false })
    );

    assert.deepEqual(aviso.lineas, [LINEA_BORRADO]);
    assert.equal(aviso.severidad, "normal");
  });

  it("con última foto que no es portada avisa la advertencia fuerte", () => {
    const aviso = construirAvisoConfirmacion(
      contexto({ esPortada: false, esUltima: true })
    );

    assert.deepEqual(aviso.lineas, [LINEA_BORRADO, LINEA_ULTIMA]);
    assert.equal(aviso.severidad, "fuerte");
  });
});

describe("mensajeResultadoEliminacion", () => {
  it("informa que el archivo también se borró", () => {
    const mensaje = mensajeResultadoEliminacion({ archivoBorrado: true });

    assert.deepEqual(mensaje, {
      texto: "Foto eliminada. El archivo también se borró del almacén.",
    });
  });

  it("informa que la foto se quitó aunque no haya motivo de conservación", () => {
    const mensaje = mensajeResultadoEliminacion({ archivoBorrado: false });

    assert.deepEqual(mensaje, { texto: "Foto quitada de esta cabaña." });
    assert.equal("advertencia" in mensaje, false);
  });

  it("explica la conservación por estar protegida en el sitio", () => {
    const mensaje = mensajeResultadoEliminacion({
      archivoBorrado: false,
      motivoConservacion: "protegida",
    });

    assert.deepEqual(mensaje, {
      texto:
        "Foto quitada de esta cabaña. El archivo se conserva porque el sitio lo usa.",
    });
  });

  it("explica la conservación por otra cabaña", () => {
    const mensaje = mensajeResultadoEliminacion({
      archivoBorrado: false,
      motivoConservacion: "otra-propiedad",
    });

    assert.deepEqual(mensaje, {
      texto:
        "Foto quitada de esta cabaña. El archivo se conserva porque otra cabaña lo usa.",
    });
  });

  it("explica la conservación por la galería de exteriores", () => {
    const mensaje = mensajeResultadoEliminacion({
      archivoBorrado: false,
      motivoConservacion: "imagenes",
    });

    assert.deepEqual(mensaje, {
      texto:
        "Foto quitada de esta cabaña. El archivo se conserva porque figura en la galería de exteriores.",
    });
  });

  it("pasa la advertencia del servidor tal cual", () => {
    const advertencia =
      "La foto se quitó de la cabaña, pero no se pudo borrar el archivo del almacenamiento.";
    const mensaje = mensajeResultadoEliminacion({
      archivoBorrado: false,
      advertencia,
    });

    assert.deepEqual(mensaje, {
      texto: "Foto quitada de esta cabaña.",
      advertencia,
    });
  });

  it("no agrega advertencia si el servidor no la envía", () => {
    const mensaje = mensajeResultadoEliminacion({
      archivoBorrado: false,
      motivoConservacion: "imagenes",
    });

    assert.equal("advertencia" in mensaje, false);
  });
});

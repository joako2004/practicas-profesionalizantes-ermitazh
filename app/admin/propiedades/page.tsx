import { prisma } from "@/lib/prisma";
import PropiedadCard from "./_components/PropiedadCard";
import PanelConfiguracionPrecios, {
  type OpcionTipoDolar,
} from "./_components/PanelConfiguracionPrecios";
import { serializarPropiedad } from "@/lib/serializers";
import { requireAdmin } from "@/lib/auth/perfil";
import { obtenerConfiguracionPrecios } from "@/lib/configuracion-precios";
import {
  obtenerCotizaciones,
  TIPOS_DOLAR,
  ETIQUETAS_TIPO_DOLAR,
  type CotizacionDolar,
  type TipoDolar,
} from "@/lib/cotizacion";

export default async function PropiedadesPage() {
  await requireAdmin();
  const [propiedades, configuracion, cotizaciones] = await Promise.all([
    prisma.propiedad.findMany({
      orderBy: { orden: "asc" },
    }),
    obtenerConfiguracionPrecios(),
    obtenerCotizaciones(),
  ]);

  // Fechas, montos y etiquetas se formatean en el servidor: al cliente solo llegan strings
  const cotizacionesPorTipo = new Map<TipoDolar, CotizacionDolar>();
  for (const cotizacion of cotizaciones) {
    cotizacionesPorTipo.set(cotizacion.tipo, cotizacion);
  }

  const formateadorFecha = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  });

  // Siempre los 7 tipos en el orden de TIPOS_DOLAR, aunque falte la cotización
  const opciones: OpcionTipoDolar[] = TIPOS_DOLAR.map((tipo) => {
    const etiqueta = ETIQUETAS_TIPO_DOLAR[tipo];
    const cotizacion = cotizacionesPorTipo.get(tipo);

    if (!cotizacion) {
      return {
        tipo,
        etiqueta,
        ventaTexto: null,
        desactualizada: false,
        fechaTexto: null,
      };
    }

    return {
      tipo,
      etiqueta,
      ventaTexto:
        "$" +
        cotizacion.venta.toLocaleString("es-AR", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }),
      desactualizada: cotizacion.desactualizada,
      fechaTexto: formateadorFecha.format(cotizacion.fechaApi ?? cotizacion.obtenidaEn),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white drop-shadow-sm">Gestión de Propiedades</h2>
          <p className="mt-1 text-sm text-white/85 drop-shadow-sm">
            {propiedades.length} propiedad{propiedades.length !== 1 ? "es" : ""} registrada{propiedades.length !== 1 ? "s" : ""}
          </p>
        </div>
        <a
          href="/admin/propiedades/new"
          className="inline-flex items-center gap-2 rounded-btn bg-toasted-brown px-4 py-2 text-sm font-medium text-white transition-all hover:bg-toasted-brown/90 active:scale-[0.97]"
        >
          <span>+</span> Nueva propiedad
        </a>
      </div>

      <PanelConfiguracionPrecios tipoActivo={configuracion.tipoDolar} opciones={opciones} temporadaActiva={configuracion.temporadaActiva} />

      {propiedades.length === 0 ? (
        <div className="rounded-lg border border-desert-sand/20 bg-white p-12 text-center">
          <div className="mb-4 text-4xl">🏠</div>
          <h3 className="text-lg font-medium text-dark-pine">No hay propiedades registradas</h3>
          <p className="mt-1 text-sm text-dark-pine/50">
            Crea tu primera propiedad para empezar a gestionar el catálogo.
          </p>
          <a
            href="/admin/propiedades/new"
            className="mt-4 inline-flex items-center gap-2 rounded-btn bg-toasted-brown px-4 py-2 text-sm font-medium text-white transition-all hover:bg-toasted-brown/90"
          >
            Crear propiedad
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {propiedades.map((propiedad) => (
            <PropiedadCard
              key={propiedad.id}
              propiedad={serializarPropiedad(propiedad)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
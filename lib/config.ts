export const WHATSAPP_NUMBER = "5491138785533";

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/complejoermitazh/?hl=es",
  booking:
    "https://www.booking.com/hotel/ar/cabanas-ermitazh.es.html?aid=356980&label=gog235jc-10CAsoDEIQY2FiYW5hcy1lcm1pdGF6aEgsWANoDIgBAZgBM7gBF8gBDNgBA-gBAfgBAYgCAagCAbgCtpHX1AbAAgHSAiQzMDEzMDZmMS03Yjk4LTQxZmItYTBlYi00MTVkZDMyZmYyMWXYAgHgAgE&sid=6138ba25e06ce6ae3e51421d460eee30&dest_id=900051559&dest_type=city&dist=0&group_adults=2&group_children=0&hapos=1&hpos=1&no_rooms=1&req_adults=2&req_children=0&room1=A%2CA&sb_price_type=total&sr_order=popularity&srepoch=1788201198&srpvid=ff04825dd1030646&type=total&ucfs=1",
  airbnb: "https://es-l.airbnb.com/rooms/1624334875518818350?source_impression_id=p3_1788201247_P3XA0UmU7RBIMpos",
};

export const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/place/Complejo+Ermitazh/@-34.61,-68.35,15z/data=!3m1!4b1!4m2!3m1!1s0x0:0x512d762d804a6c4";

export const CONTACTO = {
  email: "info@ermitazh.com",
  telefono: "+54 9 11 3878-5533",
  direccion: "San Rafael, Mendoza, Argentina",
};

export const COMPLEJO = {
  nombre: "Cabañas Ermitazh",
  tagline: "Refugio en la naturaleza",
  descripcion:
    "Un refugio en medio de la naturaleza para desconectar y recargar energías.",
  estadisticas: {
    cabanas: 8,
    metrosCuadradosParque: 12000,
    reservaDirecta: 85,
  },
};

export const SERVICIOS_GENERALES = [
  "WiFi gratuito",
  "Pileta",
  "Parrilla",
  "Estacionamiento",
  "Ropa de cama",
  "Aire acondicionado",
  "Pet friendly",
  "Calefacción",
  "Smart TV",
  "Cocina equipada",
];

export function buildWhatsAppLink(
  mensaje: string,
  phone: string = WHATSAPP_NUMBER
): string {
  const encoded = encodeURIComponent(mensaje);
  return `https://wa.me/${phone}?text=${encoded}`;
}

export function buildReservaWhatsApp(
  nombreCabana: string,
  fechaInicio?: string,
  fechaFin?: string,
  personas?: number,
  esBusquedaGeneral = false
): string {
  const nombreFormateado = esBusquedaGeneral
    ? `una cabaña para ${personas} personas`
    : `la ${nombreCabana}`;

  // Formatear fechas en formato legible en español: "5 de octubre de 2026"
  const fechaActual = new Date();
  const formatearFecha = (fechaStr: string | undefined) => {
    if (!fechaStr) return null;
    const fecha = new Date(fechaStr);
    // Agregar año solo si es distinto al actual
    const anioDiferente = fecha.getFullYear() !== fechaActual.getFullYear();
    const opciones: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
    };
    if (anioDiferente) {
      opciones.year = "numeric";
    }
    return fecha.toLocaleDateString("es-AR", opciones);
  };

  const fechaIngreso = formatearFecha(fechaInicio);
  const fechaSalida = formatearFecha(fechaFin);

  // Construir mensaje base con [tu nombre] literal (siempre presente desde el inicio)
  let mensaje = `Hola, soy [tu nombre]. Quiero reservar ${nombreFormateado}`;

  // Agregar tramo de fechas solo si ambas están presentes
  if (fechaIngreso && fechaSalida) {
    mensaje += ` desde el ${fechaIngreso} hasta el ${fechaSalida}`;
  }

return buildWhatsAppLink(mensaje);
}

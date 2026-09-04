export interface CabanaData {
  id: string;
  nombre: string;
  descripcion: string;
  capacidad: number;
  precioBase: number;
  fotos: string[];
  servicios: string[];
}

// Generar slug a partir del nombre
export function generateSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[ñ]/g, "n")
    .replace(/[á]/g, "a")
    .replace(/[é]/g, "e")
    .replace(/[í]/g, "i")
    .replace(/[ó]/g, "o")
    .replace(/[ú]/g, "u");
}

// Obtener ID por slug
export function getIdBySlug(slug: string): string | null {
  const cabana = CABANAS.find(
    (c) => c.id === slug || generateSlug(c.nombre) === slug
  );
  return cabana?.id || null;
}

export const CABANAS: CabanaData[] = [
  {
    id: "cmrj91hey0007dgdugpnxyc9b",
    nombre: "Cabaña 1",
    descripcion:
      "Cabaña grande para hasta 6 personas, 2 plantas, 2 dormitorios, 2 baños y terraza con vista al parque y la montaña.",
    capacidad: 6,
    precioBase: 130000,
    fotos: [
      "https://picsum.photos/seed/cabana-1-1/800/600",
      "https://picsum.photos/seed/cabana-1-2/800/600",
      "https://picsum.photos/seed/cabana-1-3/800/600",
    ],
    servicios: [
      "WiFi",
      "Parrilla privada",
      "Cochera techada",
      "Heladera",
      "Microondas",
      "Cocina con horno",
      "Tostadora",
      "Pava eléctrica",
      "Vajilla completa",
      "Terraza",
    ],
  },
  {
    id: "cmrj91hdc0001dgdu5braenhp",
    nombre: "Cabaña 2",
    descripcion:
      "Cabaña grande para hasta 6 personas, 2 plantas, 2 dormitorios, 2 baños y terraza con vista al parque y la montaña.",
    capacidad: 6,
    precioBase: 130000,
    fotos: [
      "https://picsum.photos/seed/cabana-2-1/800/600",
      "https://picsum.photos/seed/cabana-2-2/800/600",
      "https://picsum.photos/seed/cabana-2-3/800/600",
    ],
    servicios: [
      "WiFi",
      "Parrilla privada",
      "Cochera techada",
      "Heladera",
      "Microondas",
      "Cocina con horno",
      "Tostadora",
      "Pava eléctrica",
      "Vajilla completa",
      "Terraza",
    ],
  },
  {
    id: "cmrj91hei0002dgdup54lkg24",
    nombre: "Cabaña 3",
    descripcion:
      "Cabaña mediana para hasta 5 personas, 2 ambientes en estilo boho con machimbre blanco decorado con madera y fibras naturales.",
    capacidad: 5,
    precioBase: 110000,
    fotos: [
      "https://picsum.photos/seed/cabana-3-1/800/600",
      "https://picsum.photos/seed/cabana-3-2/800/600",
      "https://picsum.photos/seed/cabana-3-3/800/600",
    ],
    servicios: [
      "WiFi",
      "Parrilla privada",
      "Cochera techada",
      "Heladera",
      "Microondas",
      "Cocina con horno",
      "Tostadora",
      "Pava eléctrica",
      "Vajilla completa",
    ],
  },
  {
    id: "cmrj91hej0003dgduivo96c8h",
    nombre: "Cabaña 4",
    descripcion:
      "Cabaña mediana para hasta 5 personas, 2 ambientes en estilo boho con machimbre blanco decorado con madera y fibras naturales.",
    capacidad: 5,
    precioBase: 110000,
    fotos: [
      "https://picsum.photos/seed/cabana-4-1/800/600",
      "https://picsum.photos/seed/cabana-4-2/800/600",
      "https://picsum.photos/seed/cabana-4-3/800/600",
    ],
    servicios: [
      "WiFi",
      "Parrilla privada",
      "Cochera techada",
      "Heladera",
      "Microondas",
      "Cocina con horno",
      "Tostadora",
      "Pava eléctrica",
      "Vajilla completa",
    ],
  },
  {
    id: "cmrj91her0004dgdu0pdefl9u",
    nombre: "Cabaña 5",
    descripcion:
      "Monoambiente amplio para hasta 3 personas. Barra desayunadora de hierro y madera.",
    capacidad: 3,
    precioBase: 100000,
    fotos: [
      "https://picsum.photos/seed/cabana-5-1/800/600",
      "https://picsum.photos/seed/cabana-5-2/800/600",
      "https://picsum.photos/seed/cabana-5-3/800/600",
    ],
    servicios: [
      "WiFi",
      "Parrilla privada",
      "Cochera techada",
      "Heladera",
      "Microondas",
      "Cocina con horno",
      "Tostadora",
      "Pava eléctrica",
      "Vajilla completa",
      "Barra desayunadora",
    ],
  },
  {
    id: "cmrj91hes0005dgduqz8v6ari",
    nombre: "Cabaña 6",
    descripcion:
      "Monoambiente amplio para hasta 2 personas. Barra desayunadora de hierro y madera.",
    capacidad: 2,
    precioBase: 90000,
    fotos: [
      "https://picsum.photos/seed/cabana-6-1/800/600",
      "https://picsum.photos/seed/cabana-6-2/800/600",
      "https://picsum.photos/seed/cabana-6-3/800/600",
    ],
    servicios: [
      "WiFi",
      "Parrilla privada",
      "Cochera techada",
      "Heladera",
      "Microondas",
      "Cocina con horno",
      "Tostadora",
      "Pava eléctrica",
      "Vajilla completa",
      "Barra desayunadora",
    ],
  },
  {
    id: "cmrj91hew0006dgduwtct3hoh",
    nombre: "Cabaña 7",
    descripcion:
      "Cabaña mediana para hasta 5 personas, 3 ambientes en estilo industrial. Una planta.",
    capacidad: 5,
    precioBase: 120000,
    fotos: [
      "https://picsum.photos/seed/cabana-7-1/800/600",
      "https://picsum.photos/seed/cabana-7-2/800/600",
      "https://picsum.photos/seed/cabana-7-3/800/600",
    ],
    servicios: [
      "WiFi",
      "Parrilla privada",
      "Cochera techada",
      "Heladera",
      "Microondas",
      "Cocina con horno",
      "Tostadora",
      "Pava eléctrica",
      "Vajilla completa",
    ],
  },
  {
    id: "cmrj91h430000dgdu15n1fhyf",
    nombre: "Cabaña 8",
    descripcion:
      "Cabaña familiar para hasta 6 personas, 3 ambientes, 2 baños. Frente a la piscina y la fuente de los peces.",
    capacidad: 6,
    precioBase: 130000,
    fotos: [
      "https://picsum.photos/seed/cabana-8-1/800/600",
      "https://picsum.photos/seed/cabana-8-2/800/600",
      "https://picsum.photos/seed/cabana-8-3/800/600",
    ],
    servicios: [
      "WiFi",
      "Parrilla privada",
      "Cochera techada",
      "Heladera",
      "Microondas",
      "Cocina con horno",
      "Tostadora",
      "Pava eléctrica",
      "Vajilla completa",
      "Isla para cocinar",
      "Vista a piscina",
    ],
  },
];

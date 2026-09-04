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
  const cabana = CABANAS.find((c) => generateSlug(c.nombre) === slug);
  return cabana?.id || null;
}

export const CABANAS: CabanaData[] = [
  {
    id: "cmrj91hey0007dgdugpnxyc9b",
    nombre: "Cabaña 1",
    descripcion:
      "Ubicada junto al arroyo, esta cabaña para dos personas ofrece el sonido del agua como banda sonora. Deck con vista, fogón exterior y cama king size.",
    capacidad: 2,
    precioBase: 90000,
    fotos: [
      "https://picsum.photos/seed/sauce-1/800/600",
      "https://picsum.photos/seed/sauce-2/800/600",
      "https://picsum.photos/seed/sauce-3/800/600",
    ],
    servicios: [
      "Deck con vista al arroyo",
      "Fogón exterior",
      "Cama king size",
      "WiFi",
      "Cocina equipada",
      "Estacionamiento",
    ],
  },
  {
    id: "cmrj91hdc0001dgdu5braenhp",
    nombre: "Cabaña 2",
    descripcion:
      "Pequeña cabaña intimista para dos personas, con hogar a leña, bañera de hidromasaje y deck privado con vista a las montañas. Ideal para una experiencia romántica y relajante.",
    capacidad: 2,
    precioBase: 105000,
    fotos: [
      "https://picsum.photos/seed/laurel-1/800/600",
      "https://picsum.photos/seed/laurel-2/800/600",
      "https://picsum.photos/seed/laurel-3/800/600",
    ],
    servicios: [
      "Hidromasaje",
      "Hogar a leña",
      "Deck con vista",
      "WiFi",
      "Cocina equipada",
      "Estacionamiento",
    ],
  },
  {
    id: "cmrj91hei0002dgdup54lkg24",
    nombre: "Cabaña 3",
    descripcion:
      "Cabaña de estilo rústico-moderno con capacidad para 3 personas. Dormitorio con sommier, cocina integrada y galería con hamaca paraguaya. Perfecta para una escapada de fin de semana.",
    capacidad: 3,
    precioBase: 95000,
    fotos: [
      "https://picsum.photos/seed/algarrobo-1/800/600",
      "https://picsum.photos/seed/algarrobo-2/800/600",
      "https://picsum.photos/seed/algarrobo-3/800/600",
    ],
    servicios: [
      "Galería con hamaca",
      "Parrilla",
      "WiFi",
      "Cocina equipada",
      "Estacionamiento",
    ],
  },
  {
    id: "cmrj91hej0003dgduivo96c8h",
    nombre: "Cabaña 4",
    descripcion:
      "Amplia cabaña para 4 personas con estilo patagónico. Madera a la vista, chimenea, cocina completa y terraza con parrilla. A doscientos metros del sendero principal del complejo.",
    capacidad: 4,
    precioBase: 115000,
    fotos: [
      "https://picsum.photos/seed/lenga-1/800/600",
      "https://picsum.photos/seed/lenga-2/800/600",
      "https://picsum.photos/seed/lenga-3/800/600",
    ],
    servicios: [
      "Chimenea",
      "Terraza con parrilla",
      "WiFi",
      "Cocina completa",
      "Smart TV",
      "Estacionamiento",
      "Acceso a senderos",
    ],
  },
  {
    id: "cmrj91her0004dgdu0pdefl9u",
    nombre: "Cabaña 5",
    descripcion:
      "Espaciosa cabaña para hasta cuatro huéspedes, con cocina completa y terraza con parrilla. Amplios ventanales con vista al monte y bañera de hidromasaje.",
    capacidad: 4,
    precioBase: 120000,
    fotos: [
      "https://picsum.photos/seed/cedro-1/800/600",
      "https://picsum.photos/seed/cedro-2/800/600",
      "https://picsum.photos/seed/cedro-3/800/600",
    ],
    servicios: [
      "Hidromasaje",
      "Terraza con parrilla",
      "WiFi",
      "Cocina completa",
      "Estacionamiento",
      "Smart TV",
    ],
  },
  {
    id: "cmrj91hes0005dgduqz8v6ari",
    nombre: "Cabaña 6",
    descripcion:
      "Nuestra cabaña más grande, con capacidad para seis personas, hidromasaje y chimenea. Dos habitaciones, living comedor amplio y jardín privado con parrilla.",
    capacidad: 6,
    precioBase: 160000,
    fotos: [
      "https://picsum.photos/seed/nire-1/800/600",
      "https://picsum.photos/seed/nire-2/800/600",
      "https://picsum.photos/seed/nire-3/800/600",
    ],
    servicios: [
      "Chimenea",
      "Hidromasaje",
      "Jardín privado",
      "Parrilla",
      "WiFi",
      "Cocina completa",
      "Smart TV",
      "Estacionamiento",
    ],
  },
  {
    id: "cmrj91hew0006dgduwtct3hoh",
    nombre: "Cabaña 7",
    descripcion:
      "Cabaña familiar con capacidad para 5 personas. Dos dormitorios, baño completo, living con cocina integrada y amplio parque con juegos para niños.",
    capacidad: 5,
    precioBase: 130000,
    fotos: [
      "https://picsum.photos/seed/molle-1/800/600",
      "https://picsum.photos/seed/molle-2/800/600",
      "https://picsum.photos/seed/molle-3/800/600",
    ],
    servicios: [
      "Parque con juegos",
      "Parrilla",
      "WiFi",
      "Cocina completa",
      "Smart TV",
      "Estacionamiento",
      "Calefacción central",
    ],
  },
  {
    id: "cmrj91h430000dgdu15n1fhyf",
    nombre: "Cabaña 8",
    descripcion:
      "Para dos personas, con vista al lago, hogar a leña y deck privado. Ideal para una escapada romántica. Rodeada de árboles nativos con acceso directo a la orilla del lago.",
    capacidad: 2,
    precioBase: 85000,
    fotos: [
      "https://picsum.photos/seed/arrayan-1/800/600",
      "https://picsum.photos/seed/arrayan-2/800/600",
      "https://picsum.photos/seed/arrayan-3/800/600",
    ],
    servicios: [
      "Hogar a leña",
      "Deck privado",
      "WiFi",
      "Cocina equipada",
      "Parrilla",
      "Estacionamiento",
    ],
  },
];

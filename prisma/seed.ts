import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ahora = new Date();
const año = ahora.getFullYear();

// ─── Helper para fechas ─────────────────────────────
function date(mes: number, dia: number) {
  return new Date(año, mes - 1, dia);
}

// ─── Propiedades ─────────────────────────────────────
const propiedades = [
  {
    nombre: "Cabaña Arrayán",
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
  {
    nombre: "Cabaña Cedro",
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
    nombre: "Cabaña Ñire",
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
    nombre: "Cabaña Algarrobo",
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
    nombre: "Cabaña Sauce",
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
    nombre: "Cabaña Molle",
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
    nombre: "Cabaña Laurel",
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
    nombre: "Cabaña Lenga",
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
];

// ─── Precios por temporada ────────────────────────────
type PrecioSeed = {
  propiedadIndex: number;
  nombre: string;
  fechaInicio: Date;
  fechaFin: Date;
  precioPorNoche: number;
  tipoDia: "TODOS" | "SEMANA" | "FIN_DE_SEMANA";
};

const precios: PrecioSeed[] = [];

propiedades.forEach((_, i) => {
  const base = propiedades[i].precioBase;

  // Temporada alta (diciembre - febrero)
  precios.push({
    propiedadIndex: i,
    nombre: "Temporada alta",
    fechaInicio: date(12, 1),
    fechaFin: date(2, 28),
    precioPorNoche: Math.round(base * 1.35),
    tipoDia: "TODOS",
  });

  // Temporada media (marzo - abril, septiembre - noviembre)
  precios.push({
    propiedadIndex: i,
    nombre: "Temporada media",
    fechaInicio: date(3, 1),
    fechaFin: date(4, 30),
    precioPorNoche: base,
    tipoDia: "TODOS",
  });

  // Fin de semana en temporada media
  precios.push({
    propiedadIndex: i,
    nombre: "Fin de semana (temp. media)",
    fechaInicio: date(3, 1),
    fechaFin: date(4, 30),
    precioPorNoche: Math.round(base * 1.15),
    tipoDia: "FIN_DE_SEMANA",
  });

  // Temporada baja (mayo - agosto, excepto julio)
  precios.push({
    propiedadIndex: i,
    nombre: "Temporada baja",
    fechaInicio: date(5, 1),
    fechaFin: date(6, 30),
    precioPorNoche: Math.round(base * 0.8),
    tipoDia: "TODOS",
  });

  // Vacaciones de invierno (julio)
  precios.push({
    propiedadIndex: i,
    nombre: "Vacaciones de invierno",
    fechaInicio: date(7, 1),
    fechaFin: date(7, 31),
    precioPorNoche: base,
    tipoDia: "TODOS",
  });

  // Temporada baja (agosto)
  precios.push({
    propiedadIndex: i,
    nombre: "Temporada baja",
    fechaInicio: date(8, 1),
    fechaFin: date(8, 31),
    precioPorNoche: Math.round(base * 0.8),
    tipoDia: "TODOS",
  });

  // Primavera (septiembre - noviembre)
  precios.push({
    propiedadIndex: i,
    nombre: "Primavera",
    fechaInicio: date(9, 1),
    fechaFin: date(11, 30),
    precioPorNoche: base,
    tipoDia: "TODOS",
  });
});

// ─── Reservas ─────────────────────────────────────────
const reservas = [
  {
    propiedadIndex: 0,
    huespedNombre: "María López",
    huespedTelefono: "+5492615123456",
    personas: 2,
    fechaIngreso: date(7, 10),
    fechaSalida: date(7, 14),
    estado: "CONFIRMADA" as const,
    precioTotalEstadia: 459000,
    sena: 140000,
    formaPago: "Transferencia",
    notas: null,
  },
  {
    propiedadIndex: 2,
    huespedNombre: "Carlos Fernández",
    huespedTelefono: "+5492616987654",
    personas: 6,
    fechaIngreso: date(7, 15),
    fechaSalida: date(7, 20),
    estado: "CONFIRMADA" as const,
    precioTotalEstadia: 800000,
    sena: 240000,
    formaPago: "Efectivo",
    notas: "Llegan después de las 18 hs",
  },
  {
    propiedadIndex: 1,
    huespedNombre: "Laura Martínez",
    huespedTelefono: "+5492604234567",
    personas: 3,
    fechaIngreso: date(7, 18),
    fechaSalida: date(7, 21),
    estado: "PENDIENTE" as const,
    precioTotalEstadia: null,
    sena: null,
    formaPago: null,
    notas: null,
  },
  {
    propiedadIndex: 4,
    huespedNombre: "Pedro González",
    huespedTelefono: "+5492604345678",
    personas: 2,
    fechaIngreso: date(7, 5),
    fechaSalida: date(7, 8),
    estado: "CONFIRMADA" as const,
    precioTotalEstadia: 310500,
    sena: 100000,
    formaPago: "Transferencia",
    notas: null,
  },
  {
    propiedadIndex: 3,
    huespedNombre: "Ana Rodríguez",
    huespedTelefono: "+5492615456789",
    personas: 3,
    fechaIngreso: date(7, 22),
    fechaSalida: date(7, 25),
    estado: "PENDIENTE" as const,
    precioTotalEstadia: null,
    sena: null,
    formaPago: null,
    notas: "Solicitó cuna para bebé",
  },
  {
    propiedadIndex: 6,
    huespedNombre: "Santiago Pérez",
    huespedTelefono: "+5492604567890",
    personas: 2,
    fechaIngreso: date(6, 28),
    fechaSalida: date(7, 2),
    estado: "CONFIRMADA" as const,
    precioTotalEstadia: 378000,
    sena: 120000,
    formaPago: "Efectivo",
    notas: null,
  },
  {
    propiedadIndex: 5,
    huespedNombre: "Valentina Díaz",
    huespedTelefono: "+5492615678901",
    personas: 4,
    fechaIngreso: date(8, 5),
    fechaSalida: date(8, 10),
    estado: "PENDIENTE" as const,
    precioTotalEstadia: null,
    sena: null,
    formaPago: null,
    notas: null,
  },
  {
    propiedadIndex: 1,
    huespedNombre: "Lucía Torres",
    huespedTelefono: "+5492616789012",
    personas: 4,
    fechaIngreso: date(6, 10),
    fechaSalida: date(6, 14),
    estado: "RECHAZADA" as const,
    precioTotalEstadia: null,
    sena: null,
    formaPago: null,
    notas: "No aceptó los términos",
  },
  {
    propiedadIndex: 7,
    huespedNombre: "Javier Castro",
    huespedTelefono: "+5492607890123",
    personas: 4,
    fechaIngreso: date(7, 12),
    fechaSalida: date(7, 16),
    estado: "CANCELADA" as const,
    precioTotalEstadia: 460000,
    sena: 140000,
    formaPago: "Transferencia",
    notas: "Canceló por cambio de planes. Seña reintegrada.",
  },
  {
    propiedadIndex: 0,
    huespedNombre: "Florencia Ruiz",
    huespedTelefono: "+5492618901234",
    personas: 2,
    fechaIngreso: date(8, 15),
    fechaSalida: date(8, 18),
    estado: "PENDIENTE" as const,
    precioTotalEstadia: null,
    sena: null,
    formaPago: null,
    notas: null,
  },
  {
    propiedadIndex: 2,
    huespedNombre: "Gabriel Molina",
    huespedTelefono: "+5492609012345",
    personas: 5,
    fechaIngreso: date(6, 20),
    fechaSalida: date(6, 25),
    estado: "CONFIRMADA" as const,
    precioTotalEstadia: 800000,
    sena: 250000,
    formaPago: "Transferencia",
    notas: "Cumpleaños de su pareja, consultar por decoración",
  },
  {
    propiedadIndex: 4,
    huespedNombre: "Camila Acosta",
    huespedTelefono: "+5492610123456",
    personas: 2,
    fechaIngreso: date(9, 1),
    fechaSalida: date(9, 4),
    estado: "PENDIENTE" as const,
    precioTotalEstadia: null,
    sena: null,
    formaPago: null,
    notas: null,
  },
];

// ─── Reseña (asociada a la primera reserva confirmada) ──
type ResenaSeed = {
  reservaIndex: number;
  autor: string;
  texto: string;
  puntuacion: number;
  publicada: boolean;
};

const resenas: ResenaSeed[] = [
  {
    // reserva 0 → María López, Arrayán, confirmada
    reservaIndex: 0,
    autor: "María López",
    texto:
      "Una experiencia increíble. La cabaña Arrayán es hermosa, el hogar a leña y el deck con vista al lago hacen que quieras quedarte para siempre. Muy recomendable para parejas.",
    puntuacion: 5,
    publicada: true,
  },
  {
    // reserva 10 → Gabriel Molina, Ñire, confirmada
    reservaIndex: 10,
    autor: "Gabriel Molina",
    texto:
      "Pasamos el cumpleaños de mi mujer en la cabaña Ñire y fue espectacular. El espacio es enorme, la chimenea una maravilla y el hidromasaje con vista al monte no tiene precio.",
    puntuacion: 5,
    publicada: true,
  },
];

// ─── Consultas ────────────────────────────────────────
const consultas = [
  {
    nombre: "Romina Altamirano",
    email: "romina.alt@example.com",
    mensaje:
      "Hola, quería consultar si aceptan mascotas. Tengo un perro mediano muy tranquilo. Gracias.",
    estado: "PENDIENTE" as const,
  },
  {
    nombre: "Esteban Ríos",
    email: null,
    mensaje:
      "Buenas tardes, me gustaría saber si hay disponibilidad para 8 personas en fin de año (28 dic al 2 ene). ¿Qué cabañas recomiendan?",
    estado: "PENDIENTE" as const,
  },
  {
    nombre: "Carolina Vega",
    email: "carovega@example.com",
    mensaje:
      "Hola! Quería saber si la cabaña Cedro tiene acceso para silla de ruedas. Mi papá tiene movilidad reducida. Muchas gracias.",
    estado: "RESPONDIDA" as const,
  },
];

// ─── Ejecución del seed ───────────────────────────────
async function main() {
  console.log("🌱 Limpiando datos existentes...");
  await prisma.resena.deleteMany();
  await prisma.reserva.deleteMany();
  await prisma.precio.deleteMany();
  await prisma.consulta.deleteMany();
  await prisma.propiedad.deleteMany();

  console.log("🌱 Creando propiedades...");
  const creadas = await Promise.all(
    propiedades.map((p) =>
      prisma.propiedad.create({
        data: {
          nombre: p.nombre,
          descripcion: p.descripcion,
          capacidad: p.capacidad,
          precioBase: p.precioBase,
          fotos: p.fotos,
          servicios: p.servicios,
        },
      })
    )
  );
  console.log(`   ✓ ${creadas.length} propiedades`);

  console.log("🌱 Creando precios por temporada...");
  const creados = await Promise.all(
    precios.map((p) =>
      prisma.precio.create({
        data: {
          propiedadId: creadas[p.propiedadIndex].id,
          nombre: p.nombre,
          fechaInicio: p.fechaInicio,
          fechaFin: p.fechaFin,
          precioPorNoche: p.precioPorNoche,
          tipoDia: p.tipoDia,
        },
      })
    )
  );
  console.log(`   ✓ ${creados.length} precios`);

  console.log("🌱 Creando reservas...");
  const creadasReservas = await Promise.all(
    reservas.map((r) =>
      prisma.reserva.create({
        data: {
          propiedadId: creadas[r.propiedadIndex].id,
          huespedNombre: r.huespedNombre,
          huespedTelefono: r.huespedTelefono,
          personas: r.personas,
          fechaIngreso: r.fechaIngreso,
          fechaSalida: r.fechaSalida,
          estado: r.estado,
          precioTotalEstadia: r.precioTotalEstadia,
          diasEstadia: Math.round((r.fechaSalida.getTime() - r.fechaIngreso.getTime()) / (1000 * 60 * 60 * 24)),
          sena: r.sena,
          formaPago: r.formaPago,
          notas: r.notas,
        },
      })
    )
  );
  console.log(`   ✓ ${creadasReservas.length} reservas`);

  console.log("🌱 Creando reseñas...");
  for (const r of resenas) {
    await prisma.resena.create({
      data: {
        reservaId: creadasReservas[r.reservaIndex].id,
        autor: r.autor,
        texto: r.texto,
        puntuacion: r.puntuacion,
        publicada: r.publicada,
      },
    });
  }
  console.log(`   ✓ ${resenas.length} reseñas`);

  console.log("🌱 Creando consultas...");
  const consultasCreadas = await Promise.all(
    consultas.map((c) =>
      prisma.consulta.create({
        data: {
          nombre: c.nombre,
          email: c.email,
          mensaje: c.mensaje,
          estado: c.estado,
        },
      })
    )
  );
  console.log(`   ✓ ${consultasCreadas.length} consultas`);

  console.log("\n✅ Seed completado exitosamente");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

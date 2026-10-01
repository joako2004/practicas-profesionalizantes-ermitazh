import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const propiedades = [
  {
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

async function main() {
  const existing = await prisma.propiedad.count();
  if (existing > 0) {
    console.log(`⚠️  Ya existen ${existing} propiedades. Seed omitido.`);
    return;
  }

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

  console.log("\n✅ Seed completado exitosamente");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

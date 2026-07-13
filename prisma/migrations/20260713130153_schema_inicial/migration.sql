-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'RECHAZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoDia" AS ENUM ('TODOS', 'SEMANA', 'FIN_DE_SEMANA');

-- CreateEnum
CREATE TYPE "EstadoConsulta" AS ENUM ('PENDIENTE', 'RESPONDIDA');

-- CreateTable
CREATE TABLE "propiedades" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "precioBase" DECIMAL(10,2) NOT NULL,
    "fotos" TEXT[],
    "servicios" TEXT[],
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizada_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "propiedades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" TEXT NOT NULL,
    "propiedad_id" TEXT NOT NULL,
    "huesped_nombre" TEXT NOT NULL,
    "huesped_telefono" TEXT NOT NULL,
    "personas" INTEGER NOT NULL,
    "fecha_ingreso" DATE NOT NULL,
    "fecha_salida" DATE NOT NULL,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'PENDIENTE',
    "total_estadia" DECIMAL(10,2),
    "sena" DECIMAL(10,2),
    "forma_pago" TEXT,
    "notas" TEXT,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizada_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "precios" (
    "id" TEXT NOT NULL,
    "propiedad_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "precio_por_noche" DECIMAL(10,2) NOT NULL,
    "tipo_dia" "TipoDia" NOT NULL DEFAULT 'TODOS',
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "precios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "mensaje" TEXT NOT NULL,
    "estado" "EstadoConsulta" NOT NULL DEFAULT 'PENDIENTE',
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resenas" (
    "id" TEXT NOT NULL,
    "reserva_id" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "puntuacion" INTEGER NOT NULL,
    "publicada" BOOLEAN NOT NULL DEFAULT false,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resenas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resenas_reserva_id_key" ON "resenas"("reserva_id");

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_propiedad_id_fkey" FOREIGN KEY ("propiedad_id") REFERENCES "propiedades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precios" ADD CONSTRAINT "precios_propiedad_id_fkey" FOREIGN KEY ("propiedad_id") REFERENCES "propiedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

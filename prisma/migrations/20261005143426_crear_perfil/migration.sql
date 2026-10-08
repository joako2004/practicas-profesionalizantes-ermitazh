-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'HUESPED');

-- CreateTable
CREATE TABLE "perfiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT,
    "apellido" TEXT,
    "telefono" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'HUESPED',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perfiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "perfiles_email_key" ON "perfiles"("email");
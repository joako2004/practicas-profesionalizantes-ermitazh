import { prisma } from "@/lib/prisma";
import PreReservaForm from "./PreReservaForm";

async function getPropiedades() {
  return prisma.propiedad.findMany({
    where: { activa: true },
    orderBy: { orden: "asc" },
    select: { id: true, nombre: true, capacidad: true },
  });
}

export default async function PreReservaPage() {
  const propiedades = await getPropiedades();

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mx-auto max-w-xl text-center mb-12">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-muted-dark)]">
            Pre-reserva
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl">
            Completa tus datos para reservar
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-ink)]/60">
            Te enviaremos un mensaje de WhatsApp con el detalle para confirmar tu estadía.
          </p>
        </div>
        <PreReservaForm propiedades={propiedades} />
      </div>
    </section>
  );
}
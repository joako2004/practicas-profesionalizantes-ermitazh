import { requireAdmin } from "@/lib/auth/perfil";
import { prisma } from "@/lib/prisma";
import { hoyEnArgentina } from "@/lib/disponibilidad/dto";
import { aClaveFecha } from "@/lib/disponibilidad/noches";
import { obtenerDisponibilidadPublica } from "@/lib/disponibilidad/servidor";
import DisponibilidadAdmin from "./_components/DisponibilidadAdmin";

/**
 * Pantalla de administración del calendario de disponibilidad.
 *
 * Solo lectura contra la base: las cabañas activas y sus noches bloqueadas.
 * Las escrituras las hacen las server actions al presionar los botones del
 * componente cliente. "Hoy" se calcula una sola vez acá, en el servidor, y se
 * pasa como clave "AAAA-MM-DD" para evitar diferencias de hidratación.
 */
export default async function PaginaDisponibilidad() {
  await requireAdmin();

  const ahora = new Date();
  const hoy = aClaveFecha(hoyEnArgentina(ahora));

  const [propiedades, disponibilidad] = await Promise.all([
    prisma.propiedad.findMany({
      where: { activa: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    obtenerDisponibilidadPublica({ ahora }),
  ]);

  // Las noches bloqueadas del DTO se indexan por cabaña para conservar el
  // orden alfabético de las propiedades en la pantalla.
  const bloqueadasPorCabana = new Map(
    (disponibilidad?.cabanas ?? []).map((cabana) => [
      cabana.id,
      cabana.bloqueadas,
    ]),
  );

  const cabanas = propiedades.map((propiedad) => ({
    id: propiedad.id,
    nombre: propiedad.nombre,
    bloqueadas: bloqueadasPorCabana.get(propiedad.id) ?? [],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white drop-shadow-sm">
          Disponibilidad
        </h2>
        <p className="mt-1 text-sm text-white/85 drop-shadow-sm">
          Marcá las noches en las que cada cabaña NO está disponible. Las noches
          bloqueadas no se pueden elegir en el sitio.
        </p>
      </div>

      {cabanas.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center text-sm text-[var(--color-ink)]/60">
          No hay cabañas activas para gestionar.
        </div>
      ) : disponibilidad === null ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-6 text-sm text-[var(--color-danger)]">
          No se pudo cargar la disponibilidad. Recargá la página para volver a
          intentar.
        </div>
      ) : (
        <DisponibilidadAdmin
          cabanas={cabanas}
          ventana={disponibilidad.ventana}
          hoy={hoy}
        />
      )}
    </div>
  );
}

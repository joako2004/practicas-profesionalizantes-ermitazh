import Link from "next/link";

import FormularioNuevaPropiedad from "./_components/FormularioNuevaPropiedad";

export default function NuevaPropiedadPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/propiedades"
          className="inline-flex items-center rounded-[var(--radius-sm)] text-sm font-medium text-white/85 drop-shadow-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        >
          ← Volver a Propiedades
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-white drop-shadow-sm">
          Nueva propiedad
        </h2>
        <p className="mt-1 text-sm text-white/85 drop-shadow-sm">
          Completá los datos de la nueva cabaña.
        </p>
      </div>

      <FormularioNuevaPropiedad />
    </div>
  );
}

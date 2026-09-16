import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-dark-pine">Bienvenido al Panel de Administración</h2>
        <p className="mt-2 text-dark-pine/60">
          Selecciona una opción del menú lateral para comenzar.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/propiedades"
          className="group rounded-lg border border-desert-sand/20 bg-white p-6 shadow-sm transition-all hover:border-toasted-brown/40 hover:shadow-md"
        >
          <div className="mb-3 text-3xl">🏠</div>
          <h3 className="font-semibold text-dark-pine group-hover:text-toasted-brown transition-colors">
            Propiedades
          </h3>
          <p className="mt-1 text-sm text-dark-pine/50">
            Gestionar cabañas, capacidad, precios y servicios
          </p>
        </Link>

        <Link
          href="/admin/precios"
          className="group rounded-lg border border-desert-sand/20 bg-white p-6 shadow-sm transition-all hover:border-toasted-brown/40 hover:shadow-md"
        >
          <div className="mb-3 text-3xl">💰</div>
          <h3 className="font-semibold text-dark-pine group-hover:text-toasted-brown transition-colors">
            Precios
          </h3>
          <p className="mt-1 text-sm text-dark-pine/50">
            Configurar tarifas por temporada y ocupación
          </p>
        </Link>

        <Link
          href="/admin/reservas"
          className="group rounded-lg border border-desert-sand/20 bg-white p-6 shadow-sm transition-all hover:border-toasted-brown/40 hover:shadow-md"
        >
          <div className="mb-3 text-3xl">📋</div>
          <h3 className="font-semibold text-dark-pine group-hover:text-toasted-brown transition-colors">
            Reservas
          </h3>
          <p className="mt-1 text-sm text-dark-pine/50">
            Ver y gestionar reservas de huéspedes
          </p>
        </Link>

        <Link
          href="/admin/cabañas"
          className="group rounded-lg border border-desert-sand/20 bg-white p-6 shadow-sm transition-all hover:border-toasted-brown/40 hover:shadow-md"
        >
          <div className="mb-3 text-3xl">🏡</div>
          <h3 className="font-semibold text-dark-pine group-hover:text-toasted-brown transition-colors">
            Cabañas
          </h3>
          <p className="mt-1 text-sm text-dark-pine/50">
            Vista general de cabañas disponibles
          </p>
        </Link>
      </div>
    </div>
  );
}
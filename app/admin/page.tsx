export default function AdminPage() {
  return (
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col items-center justify-start pt-12 text-center md:pt-16">
      <h2 className="text-2xl font-semibold text-dark-pine">
        Bienvenido al Panel de Administración
      </h2>
      <p className="mt-2 text-dark-pine/60">
        Selecciona una opción del menú lateral para comenzar.
      </p>
    </div>
  );
}
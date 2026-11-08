export default function ComoSeCalcula() {
  return (
    <details className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <summary className="cursor-pointer list-none text-lg font-semibold text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]">
        Cómo se calcula
        <span className="ml-2 text-sm font-normal text-[var(--color-ink)]/70">
          Ver criterios
        </span>
      </summary>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="font-medium text-[var(--color-ink)]">
            Noches ocupadas
          </dt>
          <dd className="text-[var(--color-ink)]/70">
            Una noche por cabaña y fecha, sin importar cuántas reservas la
            cubran.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-[var(--color-ink)]">
            Noches disponibles
          </dt>
          <dd className="text-[var(--color-ink)]/70">
            Los días del período por la cantidad de cabañas activas.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-[var(--color-ink)]">
            Ocupación
          </dt>
          <dd className="text-[var(--color-ink)]/70">
            Noches ocupadas dividido por las noches disponibles. El valor visual
            tiene un tope del 100%; si el cálculo crudo lo supera, se muestra
            una alerta.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-[var(--color-ink)]">
            Reservas del período
          </dt>
          <dd className="text-[var(--color-ink)]/70">
            Reservas con al menos una noche dentro del rango. El día de salida
            no cuenta como noche ocupada.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-[var(--color-ink)]">
            Canceladas y rechazadas
          </dt>
          <dd className="text-[var(--color-ink)]/70">
            Se calculan sobre todas las reservas del período, sin importar el
            estado elegido para la ocupación.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-[var(--color-ink)]">
            Duración y días de semana
          </dt>
          <dd className="text-[var(--color-ink)]/70">
            La duración es la diferencia entre check-in y checkout. Los días de
            semana usan las noches únicas de cada fecha.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-[var(--color-ink)]">
            Exclusión de datos
          </dt>
          <dd className="text-[var(--color-ink)]/70">
            Las cabañas inactivas y las noches bloqueadas no se incluyen en la
            ocupación.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-[var(--color-ink)]">
            Proyección
          </dt>
          <dd className="text-[var(--color-ink)]/70">
            Las reservas futuras se incluyen. Si el rango termina después de
            hoy, la ocupación se marca como proyectada.
          </dd>
        </div>
      </dl>
    </details>
  );
}

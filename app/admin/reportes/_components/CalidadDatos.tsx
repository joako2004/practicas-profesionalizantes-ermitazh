import { formatearNumero } from "@/lib/reportes/formato";
import type { CalidadDatosReporte } from "@/lib/reportes/tipos";

interface CalidadDatosProps {
  calidad: CalidadDatosReporte;
}

type TonoAviso = "danger" | "warning";

interface Aviso {
  texto: string;
  tono: TonoAviso;
}

const PUNTOS: Record<TonoAviso, string> = {
  danger: "bg-[var(--color-danger)]",
  warning: "bg-[var(--color-warning)]",
};

export default function CalidadDatos({ calidad }: CalidadDatosProps) {
  const avisos: Aviso[] = [];

  if (calidad.superposiciones > 0) {
    avisos.push({
      texto: `${formatearNumero(
        calidad.superposiciones,
      )} noches con más de una reserva`,
      tono: "danger",
    });
  }

  if (calidad.sobrecapacidad > 0) {
    avisos.push({
      texto: `${formatearNumero(
        calidad.sobrecapacidad,
      )} reservas superan la capacidad de su cabaña`,
      tono: "danger",
    });
  }

  if (calidad.creadasDespuesDelCheckIn > 0) {
    avisos.push({
      texto: `${formatearNumero(
        calidad.creadasDespuesDelCheckIn,
      )} reservas creadas después del check-in`,
      tono: "warning",
    });
  }

  if (calidad.sinTemporada > 0) {
    avisos.push({
      texto: `${formatearNumero(
        calidad.sinTemporada,
      )} reservas sin temporada registrada`,
      tono: "warning",
    });
  }

  if (calidad.ocupacionExcedida) {
    avisos.push({
      texto: "La ocupación calculada supera el 100%",
      tono: "danger",
    });
  }

  return (
    <section
      aria-labelledby="calidad-datos-titulo"
      className="h-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
    >
      <div className="mb-4">
        <h2
          id="calidad-datos-titulo"
          className="text-lg font-semibold text-[var(--color-ink)]"
        >
          Calidad de los datos
        </h2>
        <p className="mt-1 text-sm text-[var(--color-ink)]/65">
          Controles automáticos sobre las reservas incluidas en el reporte.
        </p>
      </div>

      {avisos.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-3 py-2 text-sm text-[var(--color-success)]">
          Sin inconsistencias detectadas en el período.
        </p>
      ) : (
        <ul className="space-y-2">
          {avisos.map((aviso) => (
            <li
              key={aviso.texto}
              className="flex items-start gap-2 text-sm text-[var(--color-ink)]/75"
            >
              <span
                aria-hidden="true"
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${PUNTOS[aviso.tono]}`}
              />
              <span>{aviso.texto}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

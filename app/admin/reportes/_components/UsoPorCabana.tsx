import {
  formatearNumero,
  formatearPromedio,
} from "@/lib/reportes/formato";
import type { UsoCabanaReporte } from "@/lib/reportes/tipos";
import BarraOcupacion from "./BarraOcupacion";
import EstadoVacio from "./EstadoVacio";
import EtiquetaMasUsada from "./EtiquetaMasUsada";

interface UsoPorCabanaProps {
  cabanas: UsoCabanaReporte[];
  incluyeFuturo: boolean;
}

export default function UsoPorCabana({
  cabanas,
  incluyeFuturo,
}: UsoPorCabanaProps) {
  return (
    <section
      aria-labelledby="uso-cabana-titulo"
      className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
    >
      <div className="mb-5">
        <h2
          id="uso-cabana-titulo"
          className="text-lg font-semibold text-[var(--color-ink)]"
        >
          Uso por cabaña
        </h2>
        <p className="mt-1 text-sm text-[var(--color-ink)]/65">
          Ordenado por noches ocupadas. La ocupación se calcula sobre las noches
          del período
          {incluyeFuturo ? ", incluyendo noches futuras." : "."}
        </p>
      </div>

      {cabanas.length === 0 ? (
        <EstadoVacio
          titulo="No hay cabañas activas para mostrar"
          descripcion="Activá una cabaña para incluirla en el reporte."
          compacto
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[54rem] border-collapse text-sm">
              <caption className="sr-only">
                Uso y ocupación por cabaña en el período seleccionado
              </caption>
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase tracking-wide text-[var(--color-ink)]/55">
                  <th scope="col" className="py-3 pr-3 font-semibold">
                    Puesto
                  </th>
                  <th scope="col" className="py-3 pr-3 font-semibold">
                    Cabaña
                  </th>
                  <th scope="col" className="py-3 pr-3 font-semibold">
                    Capacidad
                  </th>
                  <th scope="col" className="py-3 pr-3 font-semibold">
                    Reservas
                  </th>
                  <th scope="col" className="py-3 pr-3 font-semibold">
                    Noches
                  </th>
                  <th scope="col" className="py-3 pr-3 font-semibold">
                    Ocupación
                  </th>
                  <th scope="col" className="py-3 pr-3 font-semibold">
                    Estadía prom.
                  </th>
                  <th scope="col" className="py-3 font-semibold">
                    Personas prom.
                  </th>
                </tr>
              </thead>
              <tbody>
                {cabanas.map((cabana) => (
                  <tr
                    key={cabana.propiedadId}
                    className={`border-b border-[var(--color-border)]/60 last:border-0 ${
                      cabana.esMasUsada
                        ? "bg-[var(--color-success-bg)]/45"
                        : "hover:bg-[var(--color-warm)]/10"
                    }`}
                  >
                    <td className="py-3 pr-3 font-medium text-[var(--color-ink)]/60">
                      #{cabana.posicion}
                    </td>
                    <th
                      scope="row"
                      className="py-3 pr-3 text-left font-medium text-[var(--color-ink)]"
                    >
                      {cabana.nombre}
                      {cabana.esMasUsada ? <EtiquetaMasUsada /> : null}
                    </th>
                    <td className="py-3 pr-3 text-[var(--color-ink)]/75">
                      {formatearNumero(cabana.capacidad)}
                    </td>
                    <td className="py-3 pr-3 text-[var(--color-ink)]/75">
                      {formatearNumero(cabana.reservas)}
                    </td>
                    <td className="py-3 pr-3 text-[var(--color-ink)]/75">
                      {formatearNumero(cabana.noches)}
                      <span className="text-[var(--color-ink)]/45">
                        {" "}
                        / {formatearNumero(cabana.nochesDisponibles)}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <BarraOcupacion cabana={cabana} />
                    </td>
                    <td className="py-3 pr-3 text-[var(--color-ink)]/75">
                      {formatearPromedio(cabana.estadiaPromedio)}
                    </td>
                    <td className="py-3 text-[var(--color-ink)]/75">
                      {formatearPromedio(cabana.personasPromedio)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {cabanas.map((cabana) => (
              <article
                key={cabana.propiedadId}
                className={`rounded-[var(--radius-md)] border p-4 ${
                  cabana.esMasUsada
                    ? "border-[var(--color-success-border)] bg-[var(--color-success-bg)]/45"
                    : "border-[var(--color-border)] bg-[var(--color-bg)]/25"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-[var(--color-ink)]/55">
                      #{cabana.posicion}
                    </p>
                    <h3 className="font-semibold text-[var(--color-ink)]">
                      {cabana.nombre}
                    </h3>
                  </div>
                  {cabana.esMasUsada ? <EtiquetaMasUsada /> : null}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <dt className="text-[var(--color-ink)]/55">Capacidad</dt>
                    <dd className="font-medium text-[var(--color-ink)]">
                      {formatearNumero(cabana.capacidad)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--color-ink)]/55">Reservas</dt>
                    <dd className="font-medium text-[var(--color-ink)]">
                      {formatearNumero(cabana.reservas)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--color-ink)]/55">Noches</dt>
                    <dd className="font-medium text-[var(--color-ink)]">
                      {formatearNumero(cabana.noches)} /{" "}
                      {formatearNumero(cabana.nochesDisponibles)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--color-ink)]/55">
                      Estadía prom.
                    </dt>
                    <dd className="font-medium text-[var(--color-ink)]">
                      {formatearPromedio(cabana.estadiaPromedio)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--color-ink)]/55">
                      Personas prom.
                    </dt>
                    <dd className="font-medium text-[var(--color-ink)]">
                      {formatearPromedio(cabana.personasPromedio)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <BarraOcupacion cabana={cabana} />
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

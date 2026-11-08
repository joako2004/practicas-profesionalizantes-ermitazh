import { formatearPorcentaje } from "@/lib/reportes/formato";
import type { UsoCabanaReporte } from "@/lib/reportes/tipos";
import BarraProgreso from "./BarraProgreso";

interface BarraOcupacionProps {
  cabana: UsoCabanaReporte;
}

export default function BarraOcupacion({ cabana }: BarraOcupacionProps) {
  return (
    <div className="min-w-[8.5rem]">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="font-medium text-[var(--color-ink)]">
          {formatearPorcentaje(cabana.ocupacion)}
        </span>
        {cabana.ocupacionCruda > 100 ? (
          <span className="text-[10px] font-medium text-[var(--color-danger)]">
            Dato inconsistente
          </span>
        ) : null}
      </div>
      <BarraProgreso
        valor={cabana.ocupacion}
        etiqueta={`Ocupación de ${cabana.nombre}: ${formatearPorcentaje(
          cabana.ocupacion,
        )}`}
        tono={cabana.esMasUsada ? "success" : "accent"}
      />
    </div>
  );
}

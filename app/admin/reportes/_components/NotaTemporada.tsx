import { formatearNumero } from "@/lib/reportes/formato";
import type { TemporadaCoberturaReporte } from "@/lib/reportes/tipos";
import TarjetaKpi from "./TarjetaKpi";

interface NotaTemporadaProps {
  temporada: TemporadaCoberturaReporte;
}

export default function NotaTemporada({ temporada }: NotaTemporadaProps) {
  return (
    <TarjetaKpi
      etiqueta="Temporada"
      valor={`${formatearNumero(
        temporada.conTemporada,
      )} de ${formatearNumero(temporada.total)}`}
      detalle="reservas con temporada registrada"
      destacada
      tinte="warning"
    >
      <p className="text-xs leading-5 text-[var(--color-surface)]/90">
        <span className="font-semibold text-[var(--color-surface)]">
          No disponible:
        </span>{" "}
        no hay rangos de temporada definidos
      </p>
    </TarjetaKpi>
  );
}

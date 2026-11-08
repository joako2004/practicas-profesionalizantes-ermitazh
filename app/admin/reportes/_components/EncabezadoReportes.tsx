interface EncabezadoReportesProps {
  subtitulo: string;
  incluyeFuturo?: boolean;
}

export default function EncabezadoReportes({
  subtitulo,
  incluyeFuturo = false,
}: EncabezadoReportesProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-white drop-shadow-sm">
          Reportes
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-white/85 drop-shadow-sm">
          {subtitulo}
        </p>
      </div>
      {incluyeFuturo ? (
        <span className="inline-flex self-start rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)]">
          Incluye noches futuras: proyección
        </span>
      ) : null}
    </header>
  );
}

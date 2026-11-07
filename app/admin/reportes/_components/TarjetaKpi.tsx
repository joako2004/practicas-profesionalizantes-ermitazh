import type { ReactNode } from "react";

type TonoValor = "neutral" | "danger" | "success";

interface TarjetaKpiProps {
  etiqueta: string;
  valor: string;
  detalle: ReactNode;
  destacada?: boolean;
  tono?: TonoValor;
  children?: ReactNode;
}

const TONOS_VALOR: Record<TonoValor, string> = {
  neutral: "text-[var(--color-ink)]",
  danger: "text-[var(--color-danger)]",
  success: "text-[var(--color-success)]",
};

export default function TarjetaKpi({
  etiqueta,
  valor,
  detalle,
  destacada = false,
  tono = "neutral",
  children,
}: TarjetaKpiProps) {
  return (
    <article
      className={`rounded-[var(--radius-lg)] border p-5 ${
        destacada
          ? "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10"
          : "border-[var(--color-border)] bg-[var(--color-surface)]"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/60">
        {etiqueta}
      </p>
      <p
        className={`mt-2 text-3xl font-semibold tracking-tight ${TONOS_VALOR[tono]}`}
      >
        {valor}
      </p>
      <div className="mt-1 text-xs leading-5 text-[var(--color-ink)]/65">
        {detalle}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  );
}

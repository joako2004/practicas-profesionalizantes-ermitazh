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

const TONOS_VALOR_DESTACADA: Record<TonoValor, string> = {
  neutral: "text-[var(--color-surface)]",
  danger: "text-[var(--color-danger-bg)]",
  success: "text-[var(--color-success-bg)]",
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
      className={`relative overflow-hidden rounded-[var(--radius-lg)] p-5 ${
        destacada
          ? "border-2 border-[var(--color-surface)]/60 bg-[var(--color-accent)]/20 shadow-md backdrop-blur-md backdrop-brightness-75"
          : "border border-[var(--color-border)] bg-[var(--color-surface)]"
      }`}
    >
      {destacada ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-surface)]/70 to-transparent"
        />
      ) : null}
      <p
        className={`text-xs font-medium uppercase tracking-wide ${
          destacada
            ? "text-[var(--color-surface)]/85"
            : "text-[var(--color-ink)]/70"
        }`}
      >
        {etiqueta}
      </p>
      <p
        className={`mt-2 text-3xl font-semibold tracking-tight ${
          destacada ? TONOS_VALOR_DESTACADA[tono] : TONOS_VALOR[tono]
        }`}
      >
        {valor}
      </p>
      <div
        className={`mt-1 text-xs leading-5 ${
          destacada
            ? "text-[var(--color-surface)]/85"
            : "text-[var(--color-ink)]/70"
        }`}
      >
        {detalle}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  );
}

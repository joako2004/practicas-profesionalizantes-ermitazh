export type TonoBarra =
  | "accent"
  | "accent-medio"
  | "accent-suave"
  | "danger"
  | "warning"
  | "success";

interface BarraProgresoProps {
  valor: number;
  etiqueta: string;
  tono?: TonoBarra;
  sobreOscuro?: boolean;
}

const TONOS: Record<TonoBarra, string> = {
  accent:
    "[&::-webkit-progress-value]:bg-[var(--color-accent)] [&::-moz-progress-bar]:bg-[var(--color-accent)]",
  "accent-medio":
    "[&::-webkit-progress-value]:bg-[var(--color-accent)]/70 [&::-moz-progress-bar]:bg-[var(--color-accent)]/70",
  "accent-suave":
    "[&::-webkit-progress-value]:bg-[var(--color-accent)]/45 [&::-moz-progress-bar]:bg-[var(--color-accent)]/45",
  danger:
    "[&::-webkit-progress-value]:bg-[var(--color-danger)] [&::-moz-progress-bar]:bg-[var(--color-danger)]",
  warning:
    "[&::-webkit-progress-value]:bg-[var(--color-warning)] [&::-moz-progress-bar]:bg-[var(--color-warning)]",
  success:
    "[&::-webkit-progress-value]:bg-[var(--color-success)] [&::-moz-progress-bar]:bg-[var(--color-success)]",
};

const TONOS_SOBRE_OSCURO: Record<TonoBarra, string> = {
  accent:
    "[&::-webkit-progress-value]:bg-[var(--color-surface)] [&::-moz-progress-bar]:bg-[var(--color-surface)]",
  "accent-medio":
    "[&::-webkit-progress-value]:bg-[var(--color-surface)]/80 [&::-moz-progress-bar]:bg-[var(--color-surface)]/80",
  "accent-suave":
    "[&::-webkit-progress-value]:bg-[var(--color-surface)]/60 [&::-moz-progress-bar]:bg-[var(--color-surface)]/60",
  danger:
    "[&::-webkit-progress-value]:bg-[var(--color-danger-bg)] [&::-moz-progress-bar]:bg-[var(--color-danger-bg)]",
  warning:
    "[&::-webkit-progress-value]:bg-[var(--color-warning-bg)] [&::-moz-progress-bar]:bg-[var(--color-warning-bg)]",
  success:
    "[&::-webkit-progress-value]:bg-[var(--color-success-bg)] [&::-moz-progress-bar]:bg-[var(--color-success-bg)]",
};

const TRACK =
  "bg-[var(--color-border)] [&::-webkit-progress-bar]:bg-[var(--color-border)]";
const TRACK_SOBRE_OSCURO =
  "bg-[var(--color-surface)]/35 [&::-webkit-progress-bar]:bg-[var(--color-surface)]/35";

export default function BarraProgreso({
  valor,
  etiqueta,
  tono = "accent",
  sobreOscuro = false,
}: BarraProgresoProps) {
  const valorSeguro = Number.isFinite(valor)
    ? Math.min(100, Math.max(0, valor))
    : 0;

  return (
    <progress
      value={valorSeguro}
      max={100}
      aria-label={etiqueta}
      className={`h-2 w-full appearance-none overflow-hidden rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:rounded-full ${
        sobreOscuro
          ? `${TRACK_SOBRE_OSCURO} ${TONOS_SOBRE_OSCURO[tono]}`
          : `${TRACK} ${TONOS[tono]}`
      }`}
    />
  );
}

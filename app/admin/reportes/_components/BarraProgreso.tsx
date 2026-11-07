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

export default function BarraProgreso({
  valor,
  etiqueta,
  tono = "accent",
}: BarraProgresoProps) {
  const valorSeguro = Number.isFinite(valor)
    ? Math.min(100, Math.max(0, valor))
    : 0;

  return (
    <progress
      value={valorSeguro}
      max={100}
      aria-label={etiqueta}
      className={`h-2 w-full appearance-none overflow-hidden rounded-full bg-[var(--color-border)] [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-[var(--color-border)] [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:rounded-full ${TONOS[tono]}`}
    />
  );
}

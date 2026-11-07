const ALTURAS = {
  0: "h-0",
  5: "h-[5%]",
  10: "h-[10%]",
  15: "h-[15%]",
  20: "h-[20%]",
  25: "h-[25%]",
  30: "h-[30%]",
  35: "h-[35%]",
  40: "h-[40%]",
  45: "h-[45%]",
  50: "h-[50%]",
  55: "h-[55%]",
  60: "h-[60%]",
  65: "h-[65%]",
  70: "h-[70%]",
  75: "h-[75%]",
  80: "h-[80%]",
  85: "h-[85%]",
  90: "h-[90%]",
  95: "h-[95%]",
  100: "h-full",
} as const;

type Altura = keyof typeof ALTURAS;

function claseAltura(valor: number): string {
  const redondeado =
    Math.round(Math.min(100, Math.max(0, valor)) / 5) * 5;

  return ALTURAS[redondeado as Altura];
}

interface BarraVerticalProps {
  alturaPct: number;
  className: string;
}

export default function BarraVertical({
  alturaPct,
  className,
}: BarraVerticalProps) {
  return (
    <div
      aria-hidden="true"
      className={`w-full rounded-t-[var(--radius-sm)] ${claseAltura(
        alturaPct,
      )} ${className}`}
    />
  );
}

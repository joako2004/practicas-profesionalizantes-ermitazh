interface EstadoVacioProps {
  titulo: string;
  descripcion?: string;
  compacto?: boolean;
}

export default function EstadoVacio({
  titulo,
  descripcion,
  compacto = false,
}: EstadoVacioProps) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] text-center ${
        compacto ? "p-6" : "p-10"
      }`}
    >
      <p className="text-sm font-medium text-[var(--color-ink)]">{titulo}</p>
      {descripcion ? (
        <p className="mt-1 text-xs leading-5 text-[var(--color-ink)]/65">
          {descripcion}
        </p>
      ) : null}
    </div>
  );
}

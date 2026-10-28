"use client";

import { useVisor } from "./VisorFotos";

interface BotonAbrirFotoProps {
  indice: number;
  numero: number;
}

export default function BotonAbrirFoto({
  indice,
  numero,
}: BotonAbrirFotoProps) {
  const { abrir } = useVisor();

  return (
    <button
      type="button"
      onClick={() => abrir(indice)}
      aria-label={`Ver la foto ${numero} en pantalla completa`}
      className="absolute inset-0 cursor-zoom-in border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent)]"
    />
  );
}

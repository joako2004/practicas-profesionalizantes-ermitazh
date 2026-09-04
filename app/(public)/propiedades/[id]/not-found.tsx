import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 text-center">
      <h1 className="text-4xl font-bold text-[var(--color-ink)]">
        Cabaña no encontrada
      </h1>
      <p className="mt-4 text-lg text-[var(--color-ink)]/70">
        La cabaña que buscas no existe o fue eliminada.
      </p>
      <Link
        href="/#cabanas"
        className="mt-8 inline-block rounded-[var(--radius-md)] bg-[var(--color-accent)] px-6 py-3 font-medium text-white transition-all hover:bg-[var(--color-accent)]/90"
      >
        Ver todas las cabañas
      </Link>
    </div>
  );
}

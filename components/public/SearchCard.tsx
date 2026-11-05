import Link from "next/link";

export default function SearchCard() {
  return (
    <div id="buscador" className="relative z-20 mx-auto max-w-5xl scroll-mt-20 px-6 -mt-16">
      <div className="rounded-[var(--radius-lg)] bg-white p-6 shadow-lg ring-1 ring-[var(--color-border)] md:p-8">
        <Link
          href="/pre-reserva"
          className="mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[var(--color-accent)]/90 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ink)]"
        >
          Ver disponibilidad
        </Link>
      </div>
    </div>
  );
}

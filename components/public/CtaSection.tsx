"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface CtaSectionProps {
  imagenFondo?: string;
}

function CtaSection({ imagenFondo }: CtaSectionProps) {
  const bgImage =
    imagenFondo || "https://picsum.photos/seed/ermitazh-cta/1920/800";

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [preReservaHref, setPreReservaHref] = useState<string>("/pre-reserva");

  useEffect(() => {
    async function checkAuth() {
      const supabase = await createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setPreReservaHref(!!session ? "/pre-reserva" : "/login?next=%2Fpre-reserva");
    }
    checkAuth();
  }, [imagenFondo]);

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 bg-[var(--color-ink)]/75" />
      <div className="relative z-10 mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl">
          ¿Listo para escapar?
        </h2>
        <p className="mt-4 text-white/70">
          Consultá disponibilidad y reservá tu cabaña en segundos.
        </p>
        <Link
          href={preReservaHref}
          className="mt-8 inline-block rounded-[var(--radius-md)] bg-[var(--color-accent)] px-8 py-3.5 text-sm font-medium text-white transition-all hover:bg-[var(--color-accent)]/90 active:scale-[0.97]"
        >
          Consultar disponibilidad
        </Link>
      </div>
    </section>
  );
}

export default CtaSection;
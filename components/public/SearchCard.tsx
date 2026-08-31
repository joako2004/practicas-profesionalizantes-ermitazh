"use client";

import { useState } from "react";
import { buildWhatsAppLink } from "@/lib/config";

function hoy(): string {
  return new Date().toISOString().split("T")[0];
}

function diaSiguiente(fecha: string): string {
  const d = new Date(fecha);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export default function SearchCard() {
  const [llegada, setLlegada] = useState("");
  const [salida, setSalida] = useState("");
  const [huespedes, setHuespedes] = useState(2);

  const minSalida = llegada ? diaSiguiente(llegada) : hoy();

  function handleLlegadaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nuevaLlegada = e.target.value;
    setLlegada(nuevaLlegada);

    if (salida && nuevaLlegada && salida <= nuevaLlegada) {
      setSalida(diaSiguiente(nuevaLlegada));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let mensaje = "Hola, quiero consultar disponibilidad";
    if (llegada && salida) {
      mensaje += ` del ${llegada} al ${salida}`;
    }
    if (huespedes) {
      mensaje += ` para ${huespedes} persona${huespedes > 1 ? "s" : ""}`;
    }
    window.open(buildWhatsAppLink(mensaje), "_blank");
  }

  return (
    <div id="buscador" className="relative z-20 mx-auto max-w-5xl px-6 -mt-16">
      <form
        onSubmit={handleSubmit}
        className="rounded-[var(--radius-lg)] bg-white shadow-lg ring-1 ring-[var(--color-border)] p-6 md:p-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="llegada" className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
              Llegada
            </label>
            <input
              id="llegada"
              type="date"
              value={llegada}
              min={hoy()}
              onChange={handleLlegadaChange}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
            />
          </div>
          <div>
            <label htmlFor="salida" className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
              Salida
            </label>
            <input
              id="salida"
              type="date"
              value={salida}
              min={minSalida}
              onChange={(e) => setSalida(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
            />
          </div>
          <div>
            <label htmlFor="huespedes" className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
              Huéspedes
            </label>
            <input
              id="huespedes"
              type="number"
              min={1}
              max={10}
              value={huespedes}
              onChange={(e) => setHuespedes(Number(e.target.value))}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--color-accent)]/90 active:scale-[0.97]"
            >
              Ver disponibilidad
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

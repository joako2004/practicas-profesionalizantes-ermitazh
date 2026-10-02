"use client";

import { useState, FormEvent } from "react";

interface Propiedad {
  id: string;
  nombre: string;
  capacidad: number;
}

interface PreReservaFormProps {
  propiedades: Propiedad[];
}

function hoy(): string {
  return new Date().toISOString().split("T")[0];
}

function diaSiguiente(fecha: string): string {
  const d = new Date(fecha);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export default function PreReservaForm({ propiedades }: PreReservaFormProps) {
  const [propiedadId, setPropiedadId] = useState("");
  const [llegada, setLlegada] = useState("");
  const [salida, setSalida] = useState("");
  const [huespedes, setHuespedes] = useState(2);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minSalida = llegada ? diaSiguiente(llegada) : hoy();
  const propiedadSeleccionada = propiedades.find((p) => p.id === propiedadId);
  const maxHuespedes = propiedadSeleccionada?.capacidad ?? 10;

  function handleLlegadaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nuevaLlegada = e.target.value;
    setLlegada(nuevaLlegada);

    if (salida && nuevaLlegada && salida <= nuevaLlegada) {
      setSalida(diaSiguiente(nuevaLlegada));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!propiedadId || !llegada || !salida || !nombre.trim() || !telefono.trim() || !huespedes) {
      setError("Completá todos los campos");
      return;
    }

    if (new Date(llegada) >= new Date(salida)) {
      setError("La fecha de llegada debe ser anterior a la de salida");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/pre-reserva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propiedad_id: propiedadId,
          fecha_inicio: llegada,
          fecha_fin: salida,
          huesped_nombre: nombre.trim(),
          huesped_telefono: telefono.trim(),
          personas: huespedes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al crear la pre-reserva");
      }

      window.location.href = `https://wa.me/5491138785533?text=${encodeURIComponent(data.mensaje)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[var(--radius-lg)] bg-white shadow-lg ring-1 ring-[var(--color-border)] p-6 md:p-8">
      {error && (
        <div className="mb-6 rounded-[var(--radius-md)] bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] px-4 py-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="propiedad" className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
            Cabaña
          </label>
          <select
            id="propiedad"
            value={propiedadId}
            onChange={(e) => setPropiedadId(e.target.value)}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
            required
          >
            <option value="">Seleccioná una cabaña</option>
            {propiedades.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} (hasta {p.capacidad} personas)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="personas" className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
            Huéspedes
          </label>
          <input
            id="personas"
            type="number"
            min={1}
            max={maxHuespedes}
            value={huespedes}
            onChange={(e) => setHuespedes(Number(e.target.value))}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            required
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
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="nombre" className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
            Nombre completo
          </label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
            required
          />
        </div>
        <div>
          <label htmlFor="telefono" className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
            Teléfono (WhatsApp)
          </label>
          <input
            id="telefono"
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+54 9 11 1234-5678"
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[var(--color-accent)]/90 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Enviando..." : "Enviar pre-reserva por WhatsApp"}
      </button>
    </form>
  );
}
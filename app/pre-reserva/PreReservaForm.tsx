"use client";

import { useState, FormEvent } from "react";
import { contarCaracteres } from "@/lib/utils";
import { buildWhatsAppLink } from "@/lib/config";
import { nochesEntre } from "@/lib/precios/estadia";
import { NOCHES_MAX } from "@/lib/precios/calcular";
import { mensajeErrorPreReserva } from "@/lib/pre-reserva/mensaje";

interface Propiedad {
  id: string;
  nombre: string;
  capacidad: number;
}

interface PreReservaFormProps {
  propiedades: Propiedad[];
}

const MAX_CARACTERES_SIN_ESPACIOS = 1000;
const MAX_CARACTERES_TOTAL = 3000;
const UMBRAL_ADVERTENCIA = 900;

// El componente se renderiza en el servidor y en el cliente, por eso se usa una
// zona fija y no la del navegador (evita desajustes de hidratación en el min).
const FORMATEADOR_HOY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function hoy(): string {
  const partes = FORMATEADOR_HOY.formatToParts(new Date());
  const anio = partes.find((parte) => parte.type === "year")?.value;
  const mes = partes.find((parte) => parte.type === "month")?.value;
  const dia = partes.find((parte) => parte.type === "day")?.value;

  if (!anio || !mes || !dia) {
    return "";
  }

  return `${anio}-${mes}-${dia}`;
}

// Las fechas "YYYY-MM-DD" se tratan siempre en UTC para evitar corrimientos de un día.
function diaSiguiente(fecha: string): string {
  const ms = Date.parse(`${fecha}T00:00:00.000Z`);

  if (Number.isNaN(ms)) {
    return hoy();
  }

  return new Date(ms + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
}

function recortarAlLimite(texto: string): string {
  let resultado = "";
  let count = 0;

  for (const char of texto) {
    if (!/\s/.test(char)) {
      if (count >= MAX_CARACTERES_SIN_ESPACIOS) {
        break;
      }
      count++;
    }
    if (resultado.length >= MAX_CARACTERES_TOTAL) {
      break;
    }
    resultado += char;
  }

  return resultado;
}

export default function PreReservaForm({ propiedades }: PreReservaFormProps) {
  const [propiedadId, setPropiedadId] = useState("");
  const [llegada, setLlegada] = useState("");
  const [salida, setSalida] = useState("");
  const [huespedes, setHuespedes] = useState(2);
  const [nombre, setNombre] = useState("");
  const [informacionAdicional, setInformacionAdicional] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minSalida = llegada ? diaSiguiente(llegada) : hoy();
  const propiedadSeleccionada = propiedades.find((p) => p.id === propiedadId);
  const maxHuespedes = propiedadSeleccionada?.capacidad ?? 10;
  const caracteresSinEspacios = contarCaracteres(informacionAdicional);
  const cercaDelLimite = caracteresSinEspacios >= UMBRAL_ADVERTENCIA;
  const excedeLimite = caracteresSinEspacios > MAX_CARACTERES_SIN_ESPACIOS;

  function handleLlegadaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nuevaLlegada = e.target.value;
    setLlegada(nuevaLlegada);

    if (salida && nuevaLlegada && salida <= nuevaLlegada) {
      setSalida(diaSiguiente(nuevaLlegada));
    }
  }

  function handleInformacionAdicionalChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const nuevoValor = e.target.value;

    if (nuevoValor.length > MAX_CARACTERES_TOTAL) {
      setInformacionAdicional(recortarAlLimite(nuevoValor));
      return;
    }

    const recortado = recortarAlLimite(nuevoValor);
    setInformacionAdicional(recortado);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!propiedadId || !llegada || !salida || !nombre.trim() || !huespedes) {
      setError("Completá todos los campos obligatorios");
      return;
    }

    if (excedeLimite) {
      setError(`La información adicional supera el límite de ${MAX_CARACTERES_SIN_ESPACIOS} caracteres (sin contar espacios)`);
      return;
    }

    if (informacionAdicional.length > MAX_CARACTERES_TOTAL) {
      setError(`La información adicional supera el límite de ${MAX_CARACTERES_TOTAL} caracteres totales`);
      return;
    }

    const noches = nochesEntre(llegada, salida);
    if (!noches.ok) {
      setError(mensajeErrorPreReserva(noches.motivo));
      return;
    }

    if (noches.noches > NOCHES_MAX) {
      setError(mensajeErrorPreReserva("ESTADIA_MUY_LARGA"));
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
          personas: huespedes,
          informacion_adicional: informacionAdicional.trim() || null,
        }),
      });

      const data: { error?: string; mensaje?: string } | null = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Error al crear la pre-reserva");
      }

      if (data === null || typeof data.mensaje !== "string") {
        throw new Error("Respuesta inesperada del servidor");
      }

      window.location.href = buildWhatsAppLink(data.mensaje);
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

      <div className="mb-4">
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

      <div className="mb-6">
        <label htmlFor="informacion-adicional" className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
          Información adicional
        </label>
        <textarea
          id="informacion-adicional"
          value={informacionAdicional}
          onChange={handleInformacionAdicionalChange}
          placeholder="Contanos cualquier detalle que quieras que tengamos en cuenta"
          rows={4}
          className={`w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10 resize-y ${
            excedeLimite ? "border-[var(--color-danger)] focus:border-[var(--color-danger)]" : ""
          }`}
        />
        <p
          className={`mt-1.5 text-xs text-right transition-colors ${
            excedeLimite
              ? "text-[var(--color-danger)]"
              : cercaDelLimite
              ? "text-[var(--color-warning)]"
              : "text-[var(--color-muted)]"
          }`}
        >
          {caracteresSinEspacios} / {MAX_CARACTERES_SIN_ESPACIOS} caracteres (sin contar espacios)
        </p>
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
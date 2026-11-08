"use client";

import { useState, useTransition, type CSSProperties } from "react";
import { PropiedadSerializer } from "@/lib/serializers";
import AtributoEditable from "./AtributoEditable";
import ConfirmDialog from "./ConfirmDialog";
import { updatePropiedadAtributo } from "@/lib/actions/propiedades";
import { esCampoUsd } from "@/lib/precios/validar";

const fechaHoraFmt = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Argentina/Buenos_Aires",
});

interface PropiedadCardProps {
  propiedad: PropiedadSerializer;
}

type TipoAtributo = "text" | "number" | "decimal" | "boolean" | "array" | "usd";

// Tonos del formulario derivados de la paleta de marca mezclada con blanco.
// Se aplican solo al contenido expandido de esta tarjeta mediante variables CSS.
const ESTILOS_FORMULARIO = {
  // Paneles: beige al ~45% de la intensidad anterior.
  "--prop-panel-bg": "#fbf8f6", // desert-sand 9% + blanco
  "--prop-panel-border": "#eee3da", // ~45% del borde anterior + blanco
  "--prop-panel-bg-soft": "#fdfbfa", // desert-sand 4% + blanco
  "--prop-panel-border-soft": "#f4ede7", // un paso más claro que el borde de panel
  "--prop-table-head-bg": "#f3ebe5", // beige suave, distinguible como cabecera
  "--prop-divider": "#ecdfd5", // ~55% de la intensidad del divisor anterior
  // Campos: borde intermedio, ~2:1 contra el fondo del panel.
  "--prop-field-border": "#c6b0a0", // toasted-brown 52% + blanco
  "--prop-field-border-hover": "#ba9f8b", // ~68% del borde original
  "--prop-field-border-empty": "#d5c4b7", // un paso más suave que el borde en reposo
  "--prop-field-bg-empty": "#f9f4f1", // beige apenas atenuado
  "--prop-field-bg-empty-hover": "#f7f1ec", // un paso más teñido
  "--prop-field-hover-bg": "#fcfaf8", // blanco apenas teñido de beige
} as CSSProperties;

// Etiquetas legibles: se usan en el diálogo de confirmación y en el aria-label
// de cada campo editable.
const ETIQUETAS_ATRIBUTOS: Record<string, string> = {
  nombre: "Nombre",
  descripcion: "Descripción",
  capacidad: "Capacidad",
  orden: "Orden",
  precioNocheAltaUsd: "Precio 1 noche - Alta (USD)",
  precio2a6AltaUsd: "Precio por noche, 2 a 6 noches - Alta (USD)",
  promoSemanalAlta: "Promo 7 o más noches - Alta (%)",
  precioNocheBajaUsd: "Precio 1 noche - Baja (USD)",
  precio2a6BajaUsd: "Precio por noche, 2 a 6 noches - Baja (USD)",
  promoSemanalBaja: "Promo 7 o más noches - Baja (%)",
  id: "ID",
  creadaEn: "Creada el",
  actualizadaEn: "Actualizada el",
};

const etiquetaDe = (key: string): string => ETIQUETAS_ATRIBUTOS[key] ?? key;

const CAMPOS_GENERALES: Array<{
  key: keyof PropiedadSerializer;
  tipo: TipoAtributo;
  anchoCompleto: boolean;
}> = [
  { key: "nombre", tipo: "text", anchoCompleto: true },
  { key: "descripcion", tipo: "text", anchoCompleto: true },
  { key: "capacidad", tipo: "number", anchoCompleto: false },
  { key: "orden", tipo: "number", anchoCompleto: false },
];

const FILAS_PRECIOS: Array<{
  etiqueta: string;
  detalle: string;
  alta: { key: keyof PropiedadSerializer; tipo: TipoAtributo };
  baja: { key: keyof PropiedadSerializer; tipo: TipoAtributo };
}> = [
  {
    etiqueta: "1 noche",
    detalle: "USD",
    alta: { key: "precioNocheAltaUsd", tipo: "usd" },
    baja: { key: "precioNocheBajaUsd", tipo: "usd" },
  },
  {
    etiqueta: "2 a 6 noches, por noche",
    detalle: "USD",
    alta: { key: "precio2a6AltaUsd", tipo: "usd" },
    baja: { key: "precio2a6BajaUsd", tipo: "usd" },
  },
  {
    etiqueta: "7 o más noches",
    detalle: "descuento %",
    alta: { key: "promoSemanalAlta", tipo: "number" },
    baja: { key: "promoSemanalBaja", tipo: "number" },
  },
];

const CAMPOS_SISTEMA: Array<{ key: keyof PropiedadSerializer; label: string }> = [
  { key: "id", label: "ID" },
  { key: "creadaEn", label: "Creada el" },
  { key: "actualizadaEn", label: "Actualizada el" },
];

const AVISOS_AL_VACIAR: Record<string, string> = {
  precioNocheAltaUsd:
    "Al dejarlo sin precio, la cabaña mostrará «Consultar» cuando la temporada ALTA esté activa, aunque tenga cargado el precio de 2 a 6 noches.",
  precioNocheBajaUsd:
    "Al dejarlo sin precio, la cabaña mostrará «Consultar» cuando la temporada BAJA esté activa, aunque tenga cargado el precio de 2 a 6 noches.",
  precio2a6AltaUsd:
    "Al dejarlo sin precio, en temporada ALTA se usará el precio de 1 noche para estadías de 2 o más noches (la promo de 7 o más noches se aplica sobre ese valor).",
  precio2a6BajaUsd:
    "Al dejarlo sin precio, en temporada BAJA se usará el precio de 1 noche para estadías de 2 o más noches (la promo de 7 o más noches se aplica sobre ese valor).",
};

export default function PropiedadCard({ propiedad }: PropiedadCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    atributo: string;
    nuevoValor: unknown;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleEditRequest = (atributo: string, nuevoValor: unknown) => {
    setConfirmDialog({ open: true, atributo, nuevoValor });
    setError(null);
  };

  const handleConfirm = () => {
    if (!confirmDialog) return;

    startTransition(async () => {
      const result = await updatePropiedadAtributo(
        propiedad.id,
        confirmDialog.atributo,
        confirmDialog.nuevoValor
      );

      if (result.success) {
        setConfirmDialog(null);
        setError(null);
      } else {
        setError(result.error || "Error al actualizar");
      }
    });
  };

  const handleCancel = () => {
    setConfirmDialog(null);
    setError(null);
  };

  const formatValue = (key: keyof PropiedadSerializer, value: unknown): string => {
    if (esCampoUsd(key)) {
      if (value === null || value === undefined) return "Sin precio";
      const n = Number(value);
      return Number.isFinite(n)
        ? `US$ ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "—";
    }
    if (value === null || value === undefined) return "—";
    if (key === "servicios") return (value as string[]).join(", ") || "—";
    if (key === "activa") return value ? "Sí" : "No";
    if (key === "creadaEn" || key === "actualizadaEn") {
      return fechaHoraFmt.format(new Date(value as string | Date));
    }
    return String(value);
  };

  return (
    <div className="rounded-lg border border-desert-sand/20 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-desert-sand/10 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-dark-pine truncate">{propiedad.nombre}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-dark">
            <span className="flex items-center gap-1.5">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 flex-shrink-0 text-muted-dark"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {propiedad.capacidad} personas
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                propiedad.activa
                  ? "bg-success-bg text-[#296036] border border-success-border"
                  : "bg-warning-bg text-[#573c00] border border-warning-border"
              }`}
            >
              {propiedad.activa ? "Activa" : "Inactiva"}
            </span>
          </div>
        </div>
        <span
          className={`flex-shrink-0 text-muted-dark transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          ▼
        </span>
      </button>

      {expanded && (
        <div
          className="space-y-4 border-t border-desert-sand/40 bg-white px-4 pb-6 pt-5 animate-slide-down sm:space-y-5 sm:px-6 sm:pb-8 sm:pt-6"
          style={ESTILOS_FORMULARIO}
        >
          <section className="rounded-md border border-[color:var(--prop-panel-border)] bg-[color:var(--prop-panel-bg)] p-4 sm:p-5">
            <h4 className="flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-dark-pine">
              <span aria-hidden="true" className="h-4 w-[2px] shrink-0 rounded-full bg-dark-pine" />
              Información general
            </h4>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              {CAMPOS_GENERALES.map(({ key, tipo, anchoCompleto }) => (
                <div key={key} className={anchoCompleto ? "sm:col-span-2" : undefined}>
                  <dt className="mb-1.5 text-xs font-medium text-muted-dark">
                    {etiquetaDe(key)}
                  </dt>
                  <dd>
                    <AtributoEditable
                      propiedadId={propiedad.id}
                      atributo={key}
                      tipo={tipo}
                      valorActual={propiedad[key]}
                      etiqueta={etiquetaDe(key)}
                      multilinea={key === "descripcion"}
                      onEditRequest={handleEditRequest}
                    />
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-md border border-[color:var(--prop-panel-border)] bg-[color:var(--prop-panel-bg)] p-4 sm:p-5">
            <h4 className="flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-dark-pine">
              <span aria-hidden="true" className="h-4 w-[2px] shrink-0 rounded-full bg-dark-pine" />
              Precios
            </h4>
            <div className="mt-4">
              <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 rounded-sm bg-[color:var(--prop-table-head-bg)] px-3 py-2.5 text-xs font-medium text-muted-dark sm:grid">
                <span>Tarifa</span>
                <span>Temporada alta</span>
                <span>Temporada baja</span>
              </div>
              <div className="divide-y divide-[color:var(--prop-divider)] sm:mt-1">
                {FILAS_PRECIOS.map((fila) => (
                  <div
                    key={fila.etiqueta}
                    className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] sm:items-center sm:gap-3 sm:px-3 sm:py-3"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-1.5">
                      <span className="text-[15px] font-semibold text-dark-pine">{fila.etiqueta}</span>
                      <span className="text-xs font-medium text-muted-dark">{fila.detalle}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:contents">
                      <div>
                        <span className="mb-1.5 block text-xs font-medium text-muted-dark sm:hidden">
                          Temporada alta
                        </span>
                        <AtributoEditable
                          propiedadId={propiedad.id}
                          atributo={fila.alta.key}
                          tipo={fila.alta.tipo}
                          valorActual={propiedad[fila.alta.key]}
                          etiqueta={etiquetaDe(fila.alta.key)}
                          onEditRequest={handleEditRequest}
                        />
                      </div>
                      <div>
                        <span className="mb-1.5 block text-xs font-medium text-muted-dark sm:hidden">
                          Temporada baja
                        </span>
                        <AtributoEditable
                          propiedadId={propiedad.id}
                          atributo={fila.baja.key}
                          tipo={fila.baja.tipo}
                          valorActual={propiedad[fila.baja.key]}
                          etiqueta={etiquetaDe(fila.baja.key)}
                          onEditRequest={handleEditRequest}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-md border border-[color:var(--prop-panel-border-soft)] bg-[color:var(--prop-panel-bg-soft)] p-4 sm:p-5">
            <h4 className="flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-dark-pine">
              <span aria-hidden="true" className="h-4 w-[2px] shrink-0 rounded-full bg-dark-pine" />
              Datos del sistema
            </h4>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {CAMPOS_SISTEMA.map(({ key, label }) => (
                <div key={key}>
                  <dt className="text-xs font-medium text-muted-dark">{label}</dt>
                  <dd className="mt-1 break-all font-mono text-[13px] text-muted-dark">
                    {formatValue(key, propiedad[key])}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      )}

      {error && (
        <div className="border-t border-desert-sand/20 bg-danger-bg px-6 py-4 animate-slide-down">
          <p className="text-sm text-danger flex items-center gap-2">
            ⚠ {error}
          </p>
        </div>
      )}

      {confirmDialog && (
        <ConfirmDialog
          open={confirmDialog.open}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          atributo={confirmDialog.atributo as keyof PropiedadSerializer}
          valorActual={formatValue(confirmDialog.atributo as keyof PropiedadSerializer, propiedad[confirmDialog.atributo as keyof PropiedadSerializer])}
          nuevoValor={formatValue(confirmDialog.atributo as keyof PropiedadSerializer, confirmDialog.nuevoValor)}
          disabled={isPending}
          etiqueta={etiquetaDe(confirmDialog.atributo)}
          aviso={confirmDialog.nuevoValor === null ? AVISOS_AL_VACIAR[confirmDialog.atributo] : undefined}
        />
      )}
    </div>
  );
}
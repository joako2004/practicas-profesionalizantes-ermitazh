"use client";

import { useState, useTransition } from "react";
import { Propiedad } from "@prisma/client";
import AtributoEditable from "./AtributoEditable";
import ConfirmDialog from "./ConfirmDialog";
import {
  actualizarMenuPrecios,
  updatePropiedadAtributo,
} from "@/lib/actions/propiedades";
import PrecioMenu from "./PrecioMenu";

interface PropiedadCardProps {
  propiedad: Propiedad;
}

const ATRIBUTOS_EDITABLES: Array<{
  key: keyof Propiedad;
  label: string;
  type: "text" | "number" | "decimal" | "boolean" | "array";
  editable: boolean;
}> = [
  { key: "nombre", label: "Nombre", type: "text", editable: true },
  { key: "descripcion", label: "Descripción", type: "text", editable: true },
  { key: "capacidad", label: "Capacidad", type: "number", editable: true },
  { key: "precioBase", label: "Precio Base", type: "decimal", editable: true },
  { key: "servicios", label: "Servicios", type: "array", editable: true },
  { key: "activa", label: "Activa", type: "boolean", editable: true },
  { key: "id", label: "ID", type: "text", editable: false },
  { key: "creadaEn", label: "Creada el", type: "text", editable: false },
  { key: "actualizadaEn", label: "Actualizada el", type: "text", editable: false },
];

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
    if (atributo === "precioBase") {
      // El menú de precios maneja su propio guardado
      setError("Guardando menú de precios...");
    } else {
      setConfirmDialog({ open: true, atributo, nuevoValor });
      setError(null);
    }
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

  const formatValue = (key: keyof Propiedad, value: unknown): string => {
    if (value === null || value === undefined) return "—";
    if (key === "precioBase") return `$${Number(value).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
    if (key === "servicios") return (value as string[]).join(", ") || "—";
    if (key === "activa") return value ? "Sí" : "No";
    if (key === "creadaEn" || key === "actualizadaEn") {
      return new Date(value as string | Date).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
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
          <h3 className="font-semibold text-dark-pine truncate">{propiedad.nombre}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-dark-pine/60">
            <span className="flex items-center gap-1">
              👥 {propiedad.capacidad} personas
            </span>
            <span className="font-medium text-toasted-brown">
              {formatValue("precioBase", propiedad.precioBase)}/noche
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                propiedad.activa
                  ? "bg-success-bg text-success border border-success-border"
                  : "bg-warning-bg text-warning border border-warning-border"
              }`}
            >
              {propiedad.activa ? "Activa" : "Inactiva"}
            </span>
          </div>
        </div>
        <span
          className={`flex-shrink-0 text-dark-pine/50 transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          ▼
        </span>
      </button>

      {expanded && (
        <div className="border-t border-desert-sand/20 bg-desert-sand/5 px-6 pb-6 animate-slide-down">
          <dl className="space-y-3">
            {ATRIBUTOS_EDITABLES.map(({ key, label, type, editable }) => {
              if (key === "precioBase") {
                return (
                  <div
                    key={key}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-white border border-desert-sand/20"
                  >
                    <dt className="flex items-center gap-2 text-sm font-medium text-dark-pine/70 min-w-[140px]">
                      Precio
                    </dt>
                    <dd className="flex-1 text-sm text-dark-pine">
                      <PrecioMenu
                        propiedadId={propiedad.id}
                        onSave={async (precios) => {
                          const result = await actualizarMenuPrecios(propiedad.id, precios);
                          if (result.success) {
                            setError(null);
                          } else {
                            setError(result.error || "Error al guardar");
                          }
                        }}
                      />
                    </dd>
                  </div>
                );
              }
              return (
                <div
                  key={key}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-white border border-desert-sand/20"
                >
                  <dt className="flex items-center gap-2 text-sm font-medium text-dark-pine/70 min-w-[140px]">
                    {label}
                  </dt>
                  <dd className="flex-1 text-sm text-dark-pine">
                    {editable ? (
                      <AtributoEditable
                        propiedadId={propiedad.id}
                        atributo={key}
                        tipo={type}
                        valorActual={propiedad[key]}
                        onEditRequest={handleEditRequest}
                      />
                    ) : (
                      <span className="text-dark-pine/60">{formatValue(key, propiedad[key])}</span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
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
          atributo={confirmDialog.atributo}
          valorActual={formatValue(confirmDialog.atributo as keyof Propiedad, propiedad[confirmDialog.atributo as keyof Propiedad])}
          nuevoValor={formatValue(confirmDialog.atributo as keyof Propiedad, confirmDialog.nuevoValor)}
          disabled={isPending}
        />
      )}
    </div>
  );
}
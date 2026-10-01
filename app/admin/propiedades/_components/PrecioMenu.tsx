"use client";

import { useState, useEffect, useCallback } from "react";

interface PrecioOpcion {
  tramoNoches: "UNA_NOCHE" | "DE_DOS_A_SEIS" | "SIETE_O_MAS";
  precioPorNoche: number;
  tipoDia: "TODOS" | "SEMANA" | "FIN_DE_SEMANA";
  estanciaTemporada: "baja" | "alta";
}

interface PrecioMenuProps {
  propiedadId: string;
  onSave: (precios: PrecioOpcion[]) => void;
}

function formatoPrecio(valor: number): string {
  return `$${valor.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PrecioMenu({ propiedadId, onSave }: PrecioMenuProps) {
  const [precios, setPrecios] = useState<PrecioOpcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrecios = async () => {
      try {
        const res = await fetch(`/api/precios?propiedadId=${propiedadId}`);
        if (!res.ok) throw new Error("Error al cargar precios");
        const data = await res.json();
        
        const formatted = data.map((p: any) => ({
          tramoNoches: p.tramoNoches,
          precioPorNoche: Number(p.precioPorNoche),
          tipoDia: p.tipoDia || "TODOS",
          estanciaTemporada: p.estanciaTemporada || "baja",
        }));
        setPrecios(formatted);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrecios();
  }, [propiedadId]);

  const handleSave = useCallback(() => {
    onSave(precios);
  }, [precios, onSave]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <span className="spinner spinner-spin text-primary" />
        <p className="mt-2 text-dark-pine/60">Cargando menú de precios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-danger">
        <p>Error al cargar precios: {error}</p>
      </div>
    );
  }

  const temporadas = ["baja", "alta"];

  return (
    <div className="space-y-4">
      {temporadas.map((temporada) => (
        <div
          key={temporada}
          className="rounded-lg border border-desert-sand/20 bg-white p-6 animate-slide-up"
        >
          <h4 className="font-semibold text-dark-pine mb-6">
            {temporada === "baja" ? "Temporada Baja" : "Temporada Alta"}
          </h4>
          <dl className="space-y-3">
            {["UNA_NOCHE", "DE_DOS_A_SEIS", "SIETE_O_MAS", "SEMANA"].map(
              (tramo, index) => (
                <div
                  key={tramo}
                  className="flex flex-col sm:flex-row gap-2 p-3 rounded-lg bg-desert-sand/5 border border-desert-sand/20"
                >
                  <dt className="flex items-center gap-2 text-sm font-medium text-dark-pine/70 min-w-[140px]">
                    {index < 3
                      ? tramo === "UNA_NOCHE"
                        ? "Precio x noche"
                        : tramo === "DE_DOS_A_SEIS"
                        ? "Precio 2-6 noches"
                        : "Precio +7 noches"
                      : "Promo semanal"}
                  </dt>
                  <dd className="flex-1">
                    <input
                      type="number"
                      value={(precios.find((p) => p.estanciaTemporada === temporada && p.tramoNoches === (tramo === "SEMANA" ? "SIETE_O_MAS" : tramo))?.precioPorNoche ?? 0)}
                      onChange={(e) =>
                        setPrecios(
          precios.map((p) =>
            p.estanciaTemporada === temporada &&
            p.tramoNoches === (tramo === "SEMANA" ? "SIETE_O_MAS" : tramo)
              ? { ...p, precioPorNoche: Number(e.target.value) || 0 }
              : p
          )
        )}
                      className="w-full rounded-btn border px-3 py-1.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-toasted-brown/40"
                      min="0"
                      step="0.01"
                      placeholder={index < 3 ? "0" : "0"}
                    />
                    {index < 3 ? (
                      <span className="text-xs text-dark-pine/40">/noche</span>
                    ) : (
                      <span className="text-xs text-dark-pine/40">/semana</span>
                    )}
                  </dd>
                </div>
              )
            )}
          </dl>
          <div className="mt-6 pt-6 border-t border-desert-sand/20">
            <button
              onClick={handleSave}
              className="w-full rounded-btn bg-toasted-brown px-4 py-2 text-sm font-medium text-white transition-all hover:bg-toasted-brown/90"
            >
              Guardar cambios
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
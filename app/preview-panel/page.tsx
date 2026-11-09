import PanelConfiguracionPrecios from "@/app/admin/propiedades/_components/PanelConfiguracionPrecios";
import type { OpcionTipoDolar } from "@/app/admin/propiedades/_components/PanelConfiguracionPrecios";
import { esAdmin } from "@/lib/auth/perfil";
import { redirect } from "next/navigation";

const OPCIONES: OpcionTipoDolar[] = [
  { tipo: "blue", etiqueta: "Dólar blue", ventaTexto: "$1.555", desactualizada: false, fechaTexto: "8/11/26, 9:00" },
  { tipo: "oficial", etiqueta: "Dólar oficial", ventaTexto: "$1.420", desactualizada: false, fechaTexto: "8/11/26, 9:00" },
  { tipo: "bolsa", etiqueta: "Dólar MEP (bolsa)", ventaTexto: "$1.510", desactualizada: false, fechaTexto: "8/11/26, 9:00" },
  { tipo: "contadoconliqui", etiqueta: "Dólar contado con liquidación", ventaTexto: "$1.530", desactualizada: false, fechaTexto: "8/11/26, 9:00" },
  { tipo: "mayorista", etiqueta: "Dólar mayorista", ventaTexto: "$1.400", desactualizada: false, fechaTexto: "8/11/26, 9:00" },
  { tipo: "cripto", etiqueta: "Dólar cripto", ventaTexto: "$1.560", desactualizada: false, fechaTexto: "8/11/26, 9:00" },
  { tipo: "tarjeta", etiqueta: "Dólar tarjeta", ventaTexto: "$1.848", desactualizada: false, fechaTexto: "8/11/26, 9:00" },
];

export default async function PreviewPanelPage() {
  const esAdministrador = await esAdmin();
  if (!esAdministrador) {
    redirect("/");
  }

  return (
    <div className="min-h-dvh bg-dark-pine/65 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <PanelConfiguracionPrecios tipoActivo="blue" opciones={OPCIONES} temporadaActiva="ALTA" />
      </div>
    </div>
  );
}

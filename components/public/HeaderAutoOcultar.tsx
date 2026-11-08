"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const MARGEN_PX = 100;
const MARGEN_ADMIN_PX = 80;
const DELTA_MINIMO_PX = 6;

export default function HeaderAutoOcultar({
  activo,
  children,
  selectorScroll,
}: {
  activo: boolean;
  children: ReactNode;
  selectorScroll?: string;
}) {
  const [oculto, setOculto] = useState(false);
  const ultimoY = useRef(0);
  const conFocoDeTeclado = useRef(false);
  const pendiente = useRef(false);

  useEffect(() => {
    if (!activo) return;

    const contenedor = selectorScroll ? document.querySelector<HTMLElement>(selectorScroll) : null;
    if (selectorScroll && !contenedor) return;

    const objetivo: HTMLElement | Window = contenedor ?? window;

    const actualizar = () => {
      pendiente.current = false;
      const y = contenedor ? contenedor.scrollTop : window.scrollY;
      const umbral = contenedor ? MARGEN_ADMIN_PX : window.innerHeight - MARGEN_PX;

      if (y <= umbral) {
        setOculto(false);
        ultimoY.current = y;
        return;
      }

      const delta = y - ultimoY.current;
      if (Math.abs(delta) < DELTA_MINIMO_PX) return;

      if (delta > 0) {
        if (!conFocoDeTeclado.current) setOculto(true);
      } else {
        setOculto(false);
      }
      ultimoY.current = y;
    };

    const alScrollear = () => {
      if (pendiente.current) return;
      pendiente.current = true;
      window.requestAnimationFrame(actualizar);
    };

    objetivo.addEventListener("scroll", alScrollear, { passive: true });
    return () => objetivo.removeEventListener("scroll", alScrollear);
  }, [activo, selectorScroll]);

  const escondido = activo && oculto;

  return (
    <header
      inert={escondido}
      onFocus={(event) => {
        if ((event.target as HTMLElement).matches(":focus-visible")) {
          conFocoDeTeclado.current = true;
          setOculto(false);
        }
      }}
      onBlur={() => {
        conFocoDeTeclado.current = false;
      }}
      className={`pointer-events-none fixed inset-x-0 top-4 z-50 px-4 transition-transform duration-300 ease-out motion-reduce:transition-none ${
        escondido ? "-translate-y-[150%]" : "translate-y-0"
      }`}
    >
      {children}
    </header>
  );
}
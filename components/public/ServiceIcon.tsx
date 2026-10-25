import type { ReactNode, SVGProps } from "react";

type ServicioIconName =
  | "wifi"
  | "pileta"
  | "parrilla"
  | "estacionamiento"
  | "ropa-cama"
  | "aire"
  | "pet"
  | "calefaccion"
  | "tv"
  | "cocina"
  | "pool-billar"
  | "sala-juegos"
  | "voley"
  | "futbol"
  | "espacio-verde"
  | "plaza-juegos"
  | "cama-elastica"
  | "generico";

const ICON_PATHS: Record<ServicioIconName, ReactNode> = {
  wifi: (
    <>
      <path d="M2 9a15.5 15.5 0 0 1 20 0" />
      <path d="M5 12.5a10 10 0 0 1 14 0" />
      <path d="M8.5 15.8a5.5 5.5 0 0 1 7 0" />
      <circle cx="12" cy="19.2" r="1" />
    </>
  ),
  pileta: (
    <>
      <path d="M2 7c.7.6 1.4 1.1 2.6 1.1C7 8.1 7 6 9.4 6s2.4 2.1 4.8 2.1S16.6 6 19 6c1.2 0 1.9.5 2.6 1.1" />
      <path d="M2 12c.7.6 1.4 1.1 2.6 1.1C7 13.1 7 11 9.4 11s2.4 2.1 4.8 2.1S16.6 11 19 11c1.2 0 1.9.5 2.6 1.1" />
      <path d="M2 17c.7.6 1.4 1.1 2.6 1.1C7 18.1 7 16 9.4 16s2.4 2.1 4.8 2.1S16.6 16 19 16c1.2 0 1.9.5 2.6 1.1" />
    </>
  ),
  parrilla: (
    <>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </>
  ),
  estacionamiento: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M10 16V8h3a2.5 2.5 0 0 1 0 5h-3" />
    </>
  ),
  "ropa-cama": (
    <>
      <path d="M3 5v14" />
      <path d="M3 11h15a3 3 0 0 1 3 3v5" />
      <path d="M3 17h18" />
      <path d="M7 11V8.5A1.5 1.5 0 0 1 8.5 7h2A1.5 1.5 0 0 1 12 8.5V11" />
    </>
  ),
  aire: (
    <>
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M20 16l-4-4 4-4" />
      <path d="M4 8l4 4-4 4" />
      <path d="M16 4l-4 4-4-4" />
      <path d="M8 20l4-4 4 4" />
    </>
  ),
  pet: (
    <>
      <circle cx="6.5" cy="11.5" r="1.7" />
      <circle cx="10" cy="8.5" r="1.7" />
      <circle cx="14" cy="8.5" r="1.7" />
      <circle cx="17.5" cy="11.5" r="1.7" />
      <ellipse cx="12" cy="16.5" rx="4.5" ry="3.4" />
    </>
  ),
  calefaccion: (
    <>
      <rect x="4" y="6" width="16" height="11" rx="1.5" />
      <path d="M8 6v11M12 6v11M16 6v11" />
      <path d="M6.5 20l-1.5 2M12 20v2M17.5 20l1.5 2" />
    </>
  ),
  tv: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M8 21h8M12 18v3" />
    </>
  ),
  cocina: (
    <>
      <path d="M4 10h16" />
      <path d="M5.5 10l.9 8.1A2 2 0 0 0 8.4 20h7.2a2 2 0 0 0 2-1.9l.9-8.1" />
      <path d="M2.5 12h2M19.5 12h2" />
      <path d="M9 6.5c0-1.1.9-1.5 1.3-2.4M13 6.5c0-1.1.9-1.5 1.3-2.4" />
    </>
  ),
  "pool-billar": (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="12" cy="12" r="1.6" />
      <path d="M12 7.8v-2.3M12 16.2v2.3M7.8 12h-2.3M16.2 12h2.3" />
      <path d="M9.2 9.2 7.4 7.4M14.8 9.2 16.6 7.4M9.2 14.8 7.4 16.6M14.8 14.8 16.6 16.6" />
      <path d="M5 19 14 10" />
      <path d="M13.2 10.8 14 10 13.2 9.2" />
      <path d="M10 13.2 9.2 14 10 14.8" />
    </>
  ),
  "sala-juegos": (
    <>
      <rect x="4" y="7" width="16" height="10" rx="2" />
      <path d="M8 10v4M6 12h4" />
      <circle cx="15" cy="11" r="0.8" />
      <circle cx="17" cy="13" r="0.8" />
      <line x1="7" y1="7" x2="7" y2="5" />
      <line x1="17" y1="7" x2="17" y2="5" />
    </>
  ),
  voley: (
    <>
      <line x1="12" y1="4" x2="12" y2="20" />
      <path d="M8 6v12M16 6v12" />
      <path d="M8 7h8M8 17h8" />
      <circle cx="12" cy="12" r="2.2" />
    </>
  ),
  futbol: (
    <>
      <path d="M6 8h12v8H6z" />
      <path d="M6 12h12" />
      <circle cx="12" cy="12" r="0.8" />
      <circle cx="6" cy="12" r="1.4" />
      <circle cx="18" cy="12" r="1.4" />
      <path d="M4.8 11.2 6 12 4.8 12.8M19.2 11.2 18 12 19.2 12.8" />
    </>
  ),
  "espacio-verde": (
    <>
      <path d="M12 5c-1.6 0-2.8 1.2-2.8 2.8 0 1 .5 1.8 1.2 2.3-.2.5-.3 1.1-.3 1.7 0 2.3 1.9 4.2 4.2 4.2s4.2-1.9 4.2-4.2c0-.6-.1-1.2-.3-1.7.7-.5 1.2-1.3 1.2-2.3 0-1.6-1.2-2.8-2.8-2.8-.5 0-.9.1-1.3.3-.4-.2-.8-.3-1.3-.3s-.9.1-1.3.3c-.4-.2-.8-.3-1.3-.3z" />
      <path d="M10.2 10.4c-1.3 0-2.4 1.1-2.4 2.4 0 1.1.8 2 1.8 2.3" />
      <path d="M3 19h18" />
      <path d="M12 16v3" />
    </>
  ),
  "plaza-juegos": (
    <>
      <path d="M5 7h14" />
      <path d="M6 7v3c0 1.7 1.3 3 3 3h6c1.7 0 3-1.3 3-3V7" />
      <path d="M7 13l-1 5M17 13l1 5" />
      <path d="M6 18h12" />
    </>
  ),
  "cama-elastica": (
    <>
      <ellipse cx="12" cy="10" rx="6" ry="2.6" />
      <path d="M6 10v2c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6v-2" />
      <path d="M7 12.4v2.6M10 13.2v2.4M14 13.2v2.4M17 12.4v2.6" />
      <path d="M10 9l2-2 2 2" />
    </>
  ),
  generico: (
    <>
      <path d="M11 3l1.7 4.8L17.5 9.5l-4.8 1.7L11 16l-1.7-4.8L4.5 9.5l4.8-1.7z" />
      <path d="M18 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
    </>
  ),
};

const SERVICIO_A_ICONO: Record<string, ServicioIconName> = {
  "WiFi gratuito": "wifi",
  Pileta: "pileta",
  Pool: "pool-billar",
  "Parrilla": "parrilla",
  "Parrilla privada": "parrilla",
  Estacionamiento: "estacionamiento",
  Cochera: "estacionamiento",
  "Cochera privada": "estacionamiento",
  "Ropa de cama": "ropa-cama",
  "Aire acondicionado": "aire",
  "Pet friendly": "pet",
  Calefacción: "calefaccion",
  "Smart TV": "tv",
  "Cocina equipada": "cocina",
  "Sala de juegos": "sala-juegos",
  "Cancha de vóley": "voley",
  "Cancha de fútbol": "futbol",
  "Espacio verde": "espacio-verde",
  "Plaza de juegos": "plaza-juegos",
  "Cama elástica": "cama-elastica",
};

interface ServiceIconProps extends SVGProps<SVGSVGElement> {
  servicio: string;
}

export default function ServiceIcon({ servicio, ...props }: ServiceIconProps) {
  const name = SERVICIO_A_ICONO[servicio] ?? "generico";

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

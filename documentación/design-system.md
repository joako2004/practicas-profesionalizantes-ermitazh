# Design System — Cabañas Ermitazh

Reglas de estilo visual del proyecto. El agente de código debe seguir estas
reglas siempre que genere o modifique UI (componentes, páginas, estilos).

## 1. Paleta de colores

| Nombre          | Hex     | Variable CSS         | Rol                                    |
|-----------------|---------|-----------------------|-----------------------------------------|
| Champagne pink  | #FFE8D6 | `--color-champagne`  | Fondo principal (light)                |
| Desert sand     | #DDBEA9 | `--color-sand`       | Fondo secundario / secciones alternadas |
| Sage            | #A5A58D | `--color-sage`       | Cards, bordes, superficies              |
| Toasted brown   | #A9764F | `--color-brown`      | Acento / CTA / links / hover            |
| Dark pine       | #2D4530 | `--color-pine`       | Texto principal, header, footer         |

### Tokens semánticos (obligatorio usar estos, no los de arriba directamente)

| Token              | Valor claro           | Uso                                  |
|--------------------|------------------------|----------------------------------------|
| `--background`     | `--color-champagne`   | Fondo de página                        |
| `--background-alt` | `--color-sand`        | Secciones alternas, footer bg          |
| `--surface`        | `--color-sage`        | Cards, inputs, badges                  |
| `--accent`         | `--color-brown`       | Botón primario, links, precios         |
| `--accent-hover`   | `#8A5E3C` (brown -15%) | Hover de accent                        |
| `--foreground`     | `--color-pine`        | Texto principal, headings              |
| `--foreground-muted` | `#5B6B54`            | Texto secundario sobre fondos claros   |
| `--border`         | `#C9C4A9`              | Bordes sutiles                         |

### Reglas de contraste (no negociable)

- Texto sobre `champagne`, `sand` o `sage` → usar `--foreground` (dark pine) o `--foreground-muted`. Nunca texto claro sobre estos fondos.
- Texto sobre `brown` o `pine` → usar blanco/crema (`#FFF8F0`). Nunca texto oscuro.
- `accent` (toasted brown) se usa solo para elementos interactivos (botones, links, precios destacados). No usarlo como fondo de página completa.
- Prohibido usar hex crudos en componentes (`bg-[#FFE8D6]`). Siempre a través de la variable o clase Tailwind mapeada.

## 2. Tipografía

- **Headings** (`h1`–`h4`): `Fraunces` (serif cálida, con carácter, transmite "cabaña/artesanal"). Peso 500–600.
- **Body / UI**: `Inter` (sans neutra, alta legibilidad en formularios y tablas de reservas). Peso 400 y 500 únicamente.
- Escala: `text-sm` (14px) body secundario, `text-base` (16px) body, `text-xl/2xl` headings de sección, `text-4xl/5xl` hero.
- No usar más de 2 familias tipográficas ni pesos por fuera de 400/500/600.

Instalación en Next.js (`app/layout.tsx`):

```tsx
import { Fraunces, Inter } from 'next/font/google'

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-heading', weight: ['500','600'] })
const inter = Inter({ subsets: ['latin'], variable: '--font-body', weight: ['400','500'] })
```

## 3. Variables CSS (`globals.css`)

```css
:root {
  /* paleta base */
  --color-champagne: #FFE8D6;
  --color-sand: #DDBEA9;
  --color-sage: #A5A58D;
  --color-brown: #A9764F;
  --color-pine: #2D4530;

  /* tokens semánticos */
  --background: var(--color-champagne);
  --background-alt: var(--color-sand);
  --surface: var(--color-sage);
  --accent: var(--color-brown);
  --accent-hover: #8A5E3C;
  --foreground: var(--color-pine);
  --foreground-muted: #5B6B54;
  --border: #C9C4A9;

  --font-heading: 'Fraunces', serif;
  --font-body: 'Inter', sans-serif;
}
```

## 4. Tailwind config (`tailwind.config.ts`)

```ts
theme: {
  extend: {
    colors: {
      champagne: 'var(--color-champagne)',
      sand: 'var(--color-sand)',
      sage: 'var(--color-sage)',
      brown: 'var(--color-brown)',
      pine: 'var(--color-pine)',
      background: 'var(--background)',
      'background-alt': 'var(--background-alt)',
      surface: 'var(--surface)',
      accent: 'var(--accent)',
      'accent-hover': 'var(--accent-hover)',
      foreground: 'var(--foreground)',
      'foreground-muted': 'var(--foreground-muted)',
      border: 'var(--border)',
    },
    fontFamily: {
      heading: ['var(--font-heading)'],
      body: ['var(--font-body)'],
    },
  },
}
```

Uso en componentes: `bg-background`, `text-foreground`, `bg-accent hover:bg-accent-hover`, `font-heading`, etc. Nunca `bg-[#A9764F]`.

## 5. Checklist para el agente antes de dar por terminado un componente

- [ ] ¿Usa tokens semánticos (`background`, `accent`, `foreground`) y no colores crudos ni nombres de paleta directos?
- [ ] ¿El texto tiene el contraste correcto según la tabla de la sección 1?
- [ ] ¿Los headings usan `font-heading` y el body `font-body`?
- [ ] ¿Hay un solo color de acento por vista (no mezclar brown con otro color como CTA)?

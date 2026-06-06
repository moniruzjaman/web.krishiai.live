# Dependencies — Why Each Exists

## Production Dependencies (19)

| Package | Version | Purpose | Could Remove? |
|---------|---------|---------|---------------|
| `react` | ^19.0.0 | UI framework | No |
| `react-dom` | ^19.0.0 | DOM rendering | No |
| `next` | ^16.1.1 | App Router framework | No |
| `leaflet` | ^1.9.4 | Map rendering (OSM, NDVI) | Would lose maps |
| `@types/leaflet` | ^1.9.21 | TypeScript types for Leaflet | No (needed for build) |
| `z-ai-web-dev-sdk` | ^0.0.17 | AI chat, VLM, text completions | Would lose AI features |
| `zod` | ^4.0.2 | Schema validation | Could use manual validation |
| `react-markdown` | ^10.1.0 | Render AI markdown responses | Could use dangerouslySetInnerHTML |
| `lucide-react` | ^0.525.0 | Icon library (40+ icons) | Could use SVG inline |
| `sonner` | ^2.0.6 | Toast notifications | Could use custom toasts |
| `next-themes` | ^0.4.6 | Dark/light theme | Could implement manually |
| `class-variance-authority` | ^0.7.1 | Component variant system (shadcn) | Would break shadcn |
| `clsx` | ^2.1.1 | Conditional classNames | Could use template literals |
| `tailwind-merge` | ^3.3.1 | Merge Tailwind classes safely | Would cause CSS conflicts |
| `tailwindcss-animate` | ^1.0.7 | Animation utilities | Could use custom CSS |
| `@radix-ui/react-scroll-area` | ^1.2.9 | Custom scroll (shadcn) | Could use native scroll |
| `@radix-ui/react-slot` | ^1.2.3 | Component composition (shadcn) | Would break shadcn Button |
| `@radix-ui/react-tabs` | ^1.1.12 | Tab navigation (shadcn) | Could build custom |
| `@radix-ui/react-toast` | ^1.2.14 | Toast primitive (shadcn) | Redundant with sonner |

## Dev Dependencies (7)

| Package | Version | Purpose |
|---------|---------|---------|
| `@tailwindcss/postcss` | ^4 | PostCSS plugin for Tailwind 4 |
| `@types/react` | ^19 | React TypeScript types |
| `@types/react-dom` | ^19 | React DOM TypeScript types |
| `bun-types` | ^1.3.4 | Bun runtime types |
| `eslint` | ^9 | Linting |
| `eslint-config-next` | ^16.1.1 | Next.js ESLint rules |
| `tailwindcss` | ^4 | CSS framework |
| `tw-animate-css` | ^1.3.5 | Animation CSS for Tailwind |
| `typescript` | ^5 | Type checking |

## Important Notes

- **No `@react-leaflet`**: Maps use plain Leaflet via dynamic import (SSR-safe)
- **No `axios`**: All fetches use native `fetch()`
- **No `framer-motion`**: Animations via Tailwind CSS only
- **No `swr`/`react-query`**: Data fetching uses useState + useEffect
- **No `next-pwa`**: PWA handled via manifest + manual install prompt
- **Redundancy**: `@radix-ui/react-toast` + `sonner` both installed; sonner is what's actually used

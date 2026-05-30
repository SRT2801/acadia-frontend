# AGENTS.md — Acadia Frontend

## Setup

```bash
npm install
# Environment files are gitignored — copy the example:
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.example.ts src/environments/environment.prod.ts
```

A separate backend is expected at the `apiUrl` in the environment file (default `http://localhost:3000`).

## Commands

| Task | Command |
|------|---------|
| Dev server | `npm start` or `ng serve` (port 4200) |
| Production build | `npm run build` or `ng build` |
| Watch/dev build | `npm run watch` |
| Run tests | `npm test` or `ng test` |
| SSR server | `npm run serve:ssr:acadia-frontend` (port 4000 or `PORT` env) |

No lint or typecheck scripts are configured in `package.json`. Format with `npx prettier --check/write .`.

## Architecture

- **Angular 21.2** standalone components, no NgModules.
- **Tailwind CSS v4** via PostCSS plugin (`@tailwindcss/postcss`). Custom design tokens in `src/styles.css` with a dark theme.
- **SSR** is enabled: client entry is `src/main.ts`, server entry is `src/main.server.ts`, Express server is `src/server.ts`. The build outputs to `dist/` in "server" output mode.
- **Cookie-based auth** with refresh-token flow (`auth.interceptor.ts`). `APP_INITIALIZER` calls `auth.me()` on startup.
- **Lazy-loaded routes** via `loadComponent` throughout (`app.routes.ts:4-66`). Routes under `/app` require the `authGuard`.
- Public pages: `/login`, `/register`, `/verify-email`, `/forgot-password`, `/auth/reset-password`. Default redirect: `/` → `/login`.

## Key directories

```
src/
  app/
    app.ts                         # Root component (footer visibility by route)
    app.config.ts                  # Client providers (router, http, auth, spinner)
    app.config.server.ts           # Merges server rendering providers
    app.routes.ts                  # Client route definitions
    app.routes.server.ts           # SSR render mode per route
    feed/                          # Feed page (the main authenticated page)
    login/ register/ ...           # Auth pages (lazy-loaded components)
    layouts/main-layout/           # Authenticated shell with sidebar
    shared/
      guards/auth.guard.ts         # Route guard (checks /auth/me)
      interceptors/auth.interceptor.ts  # 401 → refresh token → retry
      services/                    # AuthService, AlertService, SpinnerService, etc.
      ui/                          # Reusable UI components (button, input, card, sidebar, etc.)
  environments/                    # Gitignored — use environment.example.ts as template
  styles.css                       # Tailwind import + design tokens + utility classes
```

## Testing

- Uses **Vitest** via Angular's built-in `@angular/build:unit-test` builder. No separate `vitest.config.ts`.
- `tsconfig.spec.json` includes `vitest/globals` types (describe, it, expect are global).
- Test files follow `*.spec.ts` pattern.
- Run a single test: `ng test --include='**/feed/**'`

## Style conventions

- **Indent**: 2 spaces, **quotes**: single, **print width**: 100, **trailing newline**: always (see `.editorconfig` and `.prettierrc`).
- Angular component selectors use `app-` prefix.
- Use `inject()` function for DI (not constructor injection).
- Signal-based state is preferred (already used in `App` component).
- Tailwind utility classes for layout/styling; custom CSS in `styles.css` for animations and design-token-based utilities.
- Font: Switzer (variable, self-hosted woff2), supplemented by Inter, JetBrains Mono, and Material Symbols from Google Fonts.

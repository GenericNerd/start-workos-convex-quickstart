# WorkOS AuthKit + Convex + TanStack Start

Template app: **WorkOS AuthKit** (hosted login, OAuth, optional SSO) on the frontend, **Convex** for backend data and webhooks via **`@convex-dev/workos-authkit`**, and **TanStack Start** (React + TanStack Router + Vite).

Use it as a starting point for a full-stack app with managed auth and a real-time database.

## What you get

- Login and signup flows with social providers and optional email-domain SSO (configured in WorkOS and toggled with env vars).
- OAuth callback route at `/api/auth/callback` and AuthKit session handling (`@workos/authkit-tanstack-react-start`).
- Convex **AuthKit component** plus app-level `**users`** table and **audit log\*\* wiring in `convex/auth.ts` (user/session lifecycle events).
- **Convex React Query** client setup in `src/router.tsx` (`VITE_CONVEX_URL`).

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [pnpm](https://pnpm.io/) (or use `npm` / `yarn` with equivalent commands)
- A [Convex](https://www.convex.dev/) project
- A [WorkOS](https://workos.com/) account with **AuthKit** enabled

## Quick start

1. **Clone or use as a template**, then install dependencies:

```bash
 pnpm install
```

2. **Convex** — link the project and run the dev deployment (do not use `deploy` for everyday local work):

```bash
 npx convex dev
```

This updates `CONVEX_DEPLOYMENT` and related settings. Copy deployment URL values into your env file as described below. 3. **Environment variables** — create `.env.local` at the repo root (see [Environment variables](#environment-variables)). Never commit real secrets. 4. **WorkOS dashboard** — create an AuthKit application and:

- Set the **redirect URI** to match `WORKOS_REDIRECT_URI` (default for this template: `http://localhost:3000/api/auth/callback` when using `pnpm dev` on port 3000).
- Enable the sign-in methods (Google, Microsoft, SSO, etc.) that you turn on with the optional `VITE_`\* flags.

5. **Run the app**:

```bash
 pnpm dev
```

6. **Convex + WorkOS** — configure the WorkOS AuthKit integration in the Convex dashboard as required by `[@convex-dev/workos-authkit](https://www.npmjs.com/package/@convex-dev/workos-authkit)` (API key, webhook secret, client id, etc.). The exact knobs live in the Convex UI and the package docs; this repo assumes that wiring is completed so webhooks and JWT validation work.

## Environment variables

Put these in `**.env.local`\*\* (gitignored). Names match what this codebase and Convex tooling expect.

### Required for local development

| Variable                 | Description                                                                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CONVEX_DEPLOYMENT`      | Convex dev deployment slug (often written automatically when you run `npx convex dev`).                                                                        |
| `VITE_CONVEX_URL`        | Convex **HTTP** URL for the browser and Vite (`https://<deployment>.convex.cloud`). Required by `src/router.tsx`.                                              |
| `VITE_CONVEX_SITE_URL`   | Convex **site** URL (`https://<deployment>.convex.site`). Used with Convex hosting / site features; keep it aligned with your deployment.                      |
| `WORKOS_CLIENT_ID`       | WorkOS AuthKit **client ID**.                                                                                                                                  |
| `WORKOS_API_KEY`         | WorkOS **secret API key** (server-side only; used in server functions and the OAuth callback).                                                                 |
| `WORKOS_REDIRECT_URI`    | Must exactly match the redirect URI configured in WorkOS and your running app (scheme, host, port, path).                                                      |
| `WORKOS_COOKIE_PASSWORD` | Long random string used by AuthKit to seal the session cookie ([AuthKit TanStack Start](https://github.com/workos/authkit-tanstack-react-start) requirements). |

Keep the **required** block together at the top of `.env.local`. Anything **after** that (in this template, from about **line 12 onward**) is **optional**: extra auth-related `VITE_`\* toggles only—omit them or set them to `true` as needed.

### Optional — auth UI and providers

Set to the string `true` to show the corresponding option on login/signup. If unset or not `true`, that option is hidden. These are read in `src/lib/workos-social-connections.tsx` (and related routes).

| Variable                      | Description                                                   |
| ----------------------------- | ------------------------------------------------------------- |
| `VITE_GOOGLE_AUTH_ENABLED`    | Show “Continue with Google”.                                  |
| `VITE_MICROSOFT_AUTH_ENABLED` | Show “Continue with Microsoft”.                               |
| `VITE_APPLE_AUTH_ENABLED`     | Show “Continue with Apple”.                                   |
| `VITE_GITHUB_AUTH_ENABLED`    | Show “Continue with GitHub”.                                  |
| `VITE_SSO_ENABLED`            | Show email-based SSO (domain → WorkOS SSO) on the login page. |

You must still **enable the same providers and connections** in the WorkOS dashboard; these flags only control what the **UI** offers.

### Optional — general

| Variable   | Description                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `NODE_ENV` | Set automatically by Vite/Node; affects cookie `secure` flag on the login “last used method” cookie in production. |

### Production

- Use **HTTPS** and production WorkOS + Convex deployments.
- Set `WORKOS_REDIRECT_URI` (and WorkOS dashboard entries) to your public origin.
- Store secrets in your host’s secret manager or Convex/dashboard env configuration, not in the repo.

## Project layout (high level)

| Path                               | Role                                                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `convex/`                          | Convex functions, `schema.ts`, AuthKit event handlers in `auth.ts`, audit helpers under `convex/audit/`. |
| `convex/http.ts`                   | Registers WorkOS AuthKit HTTP routes on your Convex deployment.                                          |
| `src/routes/`                      | TanStack Router file routes; `_authenticated` / `_unauthenticated` layout guards.                        |
| `src/routes/api/auth/callback.tsx` | OAuth callback (code exchange, error redirects, SSO retry).                                              |
| `src/start.ts`                     | `authkitMiddleware()` for TanStack Start.                                                                |
| `src/router.tsx`                   | Convex + TanStack Query integration.                                                                     |

## Scripts

| Command          | Purpose                                                    |
| ---------------- | ---------------------------------------------------------- |
| `pnpm dev`       | Vite dev server (default port **3000** in `package.json`). |
| `pnpm build`     | Production build.                                          |
| `pnpm typecheck` | `tsc --noEmit`.                                            |
| `pnpm lint`      | ESLint.                                                    |
| `pnpm test`      | Vitest.                                                    |

## Customizing this template

- Replace placeholder product copy (e.g. “XXX” on login/signup titles) and adjust `__root.tsx` metadata title.
- Replace temporary logo at `src/components/logo.tsx`.
- Extend `convex/schema.ts` and `convex/auth.ts` carefully: the WorkOS AuthKit **component** has its own mirrored `users` table inside the component; your app table named `users` is separate and populated from webhooks in `auth.ts`.
- Add Convex env / dashboard configuration for any new server-side secrets.

## References

- [Convex docs](https://docs.convex.dev/)
- [WorkOS AuthKit](https://workos.com/docs/authkit)
- [`@convex-dev/workos-authkit`](https://www.npmjs.com/package/@convex-dev/workos-authkit)
- [`@workos/authkit-tanstack-react-start`](https://www.npmjs.com/package/@workos/authkit-tanstack-react-start)
- [TanStack Start](https://tanstack.com/start/latest)

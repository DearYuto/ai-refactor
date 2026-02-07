# AGENTS.md

# Repository Guidance for Agentic Coding

This file documents build/test/lint commands and local conventions.
Follow these guidelines when making changes in this repository.

## Rules Sources

- No .cursor rules found (.cursor/rules, .cursorrules).
- No GitHub Copilot instructions found (.github/copilot-instructions.md).
- This AGENTS.md is the primary repo guidance below system instructions.

## Repo Overview

- Monorepo managed with Bun workspaces and Turborepo.
- Frontend: Next.js (App Router) in `apps/web`.
- Backend: NestJS in `apps/api`.
- Shared types: `packages/types`.

## Quick Commands (Root)

- Install: `bun install`
- Dev (all): `bun run dev` (turbo dev)
- Build (all): `bun run build` (turbo build)
- Lint (all): `bun run lint` (turbo lint)
- Format: `bun run format` (prettier)

## Frontend (apps/web)

### Commands

- Dev: `bun run dev`
- Build: `bun run build`
- Start: `bun run start`
- Lint: `bun run lint`

### Notes

- App Router routes live in `apps/web/app`.
- Client components must include `"use client"`.
- Use shared API base URL from `apps/web/lib/config.ts`.
- Default dev URL: http://localhost:3000.

## Backend (apps/api)

### Commands

- Dev: `bun run start:dev`
- Build: `bun run build`
- Lint: `bun run lint`
- Unit tests: `bun run test`
- Watch tests: `bun run test:watch`
- Coverage: `bun run test:cov`
- E2E tests: `bun run test:e2e`

### Single Test (Backend)

- By name: `bun run test -- -t "test name"`
- By path: `bun run test -- --runTestsByPath src/app.controller.spec.ts`
- E2E by name: `bun run test:e2e -- -t "test name"`

### Runtime Defaults

- API port: `process.env.PORT ?? 8000` (see `apps/api/src/main.ts`).
- CORS: allows http://localhost:3000.
- JWT secret: `process.env.JWT_SECRET ?? "dev-secret"`.

## Shared Types (packages/types)

- Keep types small and serializable.
- Add exports to `packages/types/index.ts`.
- Update both `apps/web` and `apps/api` dependencies if a new package is added.

## Code Style Guidelines

### General

- Use TypeScript throughout.
- Prefer explicit types for public functions and exported values.
- Avoid `any` unless absolutely required.
- No `@ts-ignore` or `@ts-expect-error` unless justified in the PR.
- Use async/await; avoid floating promises (lint warns on this).

### SOLID and Architecture Principles

- Apply the Single Responsibility Principle: each module/class/function should do one job well.
- Favor composition over inheritance for extensibility.
- Keep dependencies flowing one direction (types -> services -> controllers).
- Prioritize reuse through clear boundaries, not shared global utilities.
- Optimize for DX: readable, discoverable, and low-surprise code.
- Prefer cohesion within a domain over cross-cutting abstractions.
- Avoid over-engineering: choose the simplest design that meets current requirements.

### Official Best Practices

- Follow official docs for framework/library usage (Next.js, React, NestJS).
- React effects: prevent race conditions and duplicate side effects; clean up subscriptions, timeouts, and async tasks in `useEffect`.
- Avoid effects that derive state; compute derived values during render or with memoization.

### Architecture and Clean Code

- Keep modules small, cohesive, and dependency-directional (types -> services -> controllers).
- Separate concerns: controllers handle I/O, services handle business logic.
- Favor pure functions for domain logic; keep side effects in services.
- Prefer explicit naming over abbreviations; match file names to exported class/function.
- Avoid implicit globals; pass dependencies via constructor or function args.
- Keep public APIs stable; avoid breaking changes without notes.

### Formatting

- Root formatting uses Prettier (`bun run format`).
- ESLint is the source of truth for code-style warnings.
- Prefer array destructuring over numeric index access when mapping arrays (for readability).

### Imports

- Keep import groups separated: external, internal, relative.
- Remove unused imports.

### Error Handling

- Backend: use NestJS `HttpException` or specific exceptions.
- Frontend: handle loading/error states for network calls.

## Backend Architecture Conventions

- Use module/controller/service pattern.
- Keep controllers thin; move logic into services.
- DTOs live under `apps/api/src/<module>/dto`.
- Keep in-memory stores isolated to service layer (until DB added).

## Domain-Centric Structure (New Rule)

- Organize by domain first (e.g., `auth/`, `wallet/`, `market/`, `orders/`).
- Keep each domain self-contained: controller/service/dto/types/tests live together.
- Shared UI and utilities should be easy to find; prefer:
  - `apps/web/components/*` for truly reusable UI
  - `apps/web/lib/*` for shared helpers
- Avoid dumping everything into `components` or `utils`.
- If a component or helper is domain-specific, keep it inside the domain folder.

## Frontend Conventions

- Use Tailwind utility classes for styling.
- Keep pages accessible (semantic elements, readable hierarchy).
- Prefer small, composable sections over monolithic layouts.
- State: use `zustand` for client state, `@tanstack/react-query` for server state.
- i18n: use `next-intl` for locale messages and formatting.
- UI: use `@headlessui/react` for accessible, unstyled primitives when needed.
- Component file naming: use kebab-case filenames. For modal content components use `modal-contents.tsx` (not `ModalContents.tsx`).
- Tailwind: use shared preset from `@repo/config` (default to `tailwindPresetV1`) and avoid breaking changes within a version.

## Files to Avoid Committing

- Local agent state: `.omc/`, `.opencode/` (keep untracked).
- Build output: `.next/`, `dist/`, `.turbo/`, `node_modules/`.

## Common API Endpoints (Current)

- `GET /health` -> { status: 'ok' }
- `POST /auth/signup` -> { accessToken }
- `POST /auth/login` -> { accessToken }
- `GET /auth/me` -> { email }
- `GET /wallet/balance` -> { balances: [...] }
- `GET /market/ticker` -> ticker data
- `GET /market/orderbook` -> orderbook data

## Suggested Verification Workflow

1. `bun run lint`
2. `bun run build`
3. API smoke tests with curl
   - `curl http://localhost:8000/health`
   - `curl http://localhost:8000/market/ticker`
4. Frontend check: http://localhost:3000

## Notes for Agents

- Keep changes minimal and focused.
- Prefer multiple small commits over one large commit.
- Do not introduce new dependencies without a clear reason.
- Ask if any ambiguity affects API contracts or security.

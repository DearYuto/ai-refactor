# Decisions - Shared Types Configuration

- Used `workspace:*` for `@repo/types` dependency in `apps/web` and `apps/api` to ensure they always use the local version within the monorepo.
- Pointed `main` and `types` in `packages/types/package.json` directly to `./index.ts` since this is a simple type-only package and Bun/TypeScript can handle direct TS imports well in this monorepo setup.

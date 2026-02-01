# Learnings - Shared Types Configuration

- NestJS (`apps/api`) and Next.js (`apps/web`) can both share types from a local workspace package in a Bun-managed monorepo.
- `turbo build` correctly identifies and builds both apps, confirming that the cross-package dependencies are resolved correctly.
- When adding a local package as a dependency, `bun install` ensures that the symbolic links are correctly set up in `node_modules`.
- NestJS CORS is configured in `apps/api/src/main.ts` with `app.enableCors` for specific frontend origins.

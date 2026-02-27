# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `yarn dev`
- **Build (with type-check):** `yarn build`
- **Build (no type-check):** `yarn build-only`
- **Type-check only:** `yarn type-check` (runs `vue-tsc --build`)
- **Lint (oxlint + eslint, with autofix):** `yarn lint`
- **Lint oxlint only:** `yarn lint:oxlint`
- **Lint eslint only:** `yarn lint:eslint`
- **Format:** `yarn format`
- **Preview production build:** `yarn preview`

No test framework is configured yet.

## Architecture

Vue 3 + TypeScript SPA using **Vite 7**, **Vue Router 5** (history mode), and **Pinia 3** for state management. The `@` path alias resolves to `./src`.

Follow **Clean Architecture** and **Clean Code** principles. The dependency rule is strict: inner layers never import from outer layers.

### Layers (inside → outside)

1. **Entities** (`src/entities/`) — pure TypeScript types, interfaces, and domain models. No framework imports. These represent core business concepts.
2. **Use Cases** (`src/usecases/`) — application-specific business rules. Pure functions or classes that orchestrate entities. Depend only on entities and port interfaces. No Vue, no Pinia, no HTTP clients.
3. **Adapters** (`src/adapters/`) — implementations that bridge use cases to the outside world:
   - `src/adapters/repositories/` — concrete data access (API calls, localStorage). Implement repository interfaces defined in use cases.
   - `src/adapters/mappers/` — transform between API/external DTOs and domain entities.
4. **Framework / UI** (outermost) — Vue components, composables, stores, router:
   - `src/views/` — page-level components tied to routes
   - `src/components/` — reusable presentational components
   - `src/composables/` — Vue composables that wire use cases into the reactivity system
   - `src/stores/` — Pinia stores that hold reactive state and call use cases
   - `src/router/` — route definitions

### Dependency rule in practice

- **Entities** import nothing from the project (only standard TypeScript).
- **Use Cases** import from `entities/` only. Define port interfaces (e.g., repository contracts) that adapters implement.
- **Adapters** import from `entities/` and `usecases/` (for port interfaces). Never import Vue or Pinia.
- **UI layer** (components, composables, stores) may import from all inner layers but inner layers never import from the UI.

### Clean Code principles

- **Single Responsibility:** each file handles one concern.
- **Small functions:** do one thing. Extract helpers and composables over long procedural blocks.
- **Meaningful names:** descriptive, intention-revealing. Avoid abbreviations and generic names (`data`, `info`, `temp`).
- **No magic values:** extract literals into named constants or enums.
- **Composition over inheritance:** share behavior via composables.
- **Minimal component API:** props down, events up. Keep interfaces narrow and explicit.

### Key files

- `src/main.ts` — app entry; mounts Vue with Pinia and Router
- `src/router/index.ts` — route definitions
- `src/stores/` — Pinia stores (composition/setup style)
- `src/App.vue` — root component

## Code Style

- **Prettier:** no semicolons, single quotes, 100-char print width
- **Linting** runs OxLint first (with eslint/typescript/unicorn/vue plugins), then ESLint. The ESLint config integrates with OxLint to avoid duplicate rules.
- Vue components use `<script setup lang="ts">` (Composition API with TypeScript)
- Pinia stores use the composition/setup style (`defineStore` with a setup function), not the options style
- 2-space indentation, LF line endings

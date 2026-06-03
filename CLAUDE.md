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

No test framework is configured.

Deployed via Firebase Hosting (`firebase.json` serves `dist/` as an SPA). Firestore security rules live in `firestore.rules`. Firebase config comes from `VITE_FIREBASE_*` env vars (`.env`, not committed).

## What This App Is

A personal monthly-finance tracker (UI text is in **Brazilian Portuguese**). Domain entities: owners (titulares), bank accounts, transactions, payment categories, payment templates (modelos), payments, and payment batches. Data is stored per-user in Firestore under `users/{uid}/{collection}/{docId}`, with Google sign-in via Firebase Auth.

## Architecture

Vue 3 + TypeScript SPA using **Vite 7**, **Vue Router 5** (history mode), **Pinia 3**, **Tailwind CSS 4** (via `@tailwindcss/vite`), and **Firebase** (Auth + Firestore). The `@` path alias resolves to `./src`.

Follow **Clean Architecture**. The dependency rule is strict: inner layers never import from outer layers.

### Layers (inside → outside)

1. **Entities** (`src/entities/`) — pure TypeScript interfaces plus `createX()` factory functions that generate ids with `crypto.randomUUID()`. No framework imports. Re-exported through `src/entities/index.ts`.
2. **Use Cases** (`src/usecases/`) — classes that take repository ports via constructor injection and enforce business rules (e.g. delete is blocked while dependent records exist, returning `UseCaseResult { success, error }` with a Portuguese error message). Port interfaces live in `src/usecases/ports/`. No Vue, no Pinia, no Firebase.
3. **Adapters** (`src/adapters/`):
   - `src/adapters/firebase/` — lazy singletons for the Firebase app, Auth (Google popup sign-in), and Firestore instance.
   - `src/adapters/repositories/` — Firestore implementations of the port interfaces. Never import Vue or Pinia.
4. **UI** (outermost) — `src/views/` (page components, one folder per entity with `*ListView` / `*FormView`), `src/components/`, `src/composables/`, `src/stores/`, `src/router/`.

### Data flow & key mechanics

- **`FirestoreRepository<T>`** (`src/adapters/repositories/firestore-repository.ts`) is a generic base used by every entity repository. It loads the whole collection into an in-memory `Map` on `initialize()`, then serves all reads synchronously from that cache. Writes update the cache immediately and persist to Firestore **fire-and-forget** (errors only logged). Consequence: use-case and store APIs are synchronous; there are no loading states past login.
- **Repository provider** (`src/adapters/repositories/repository-provider.ts`) holds module-level singletons. `initializeRepositories(db, userId)` constructs and initializes all repositories after login; `getXRepository()` accessors throw if called before that. Adding an entity means: entity + port + firestore repository (with serialize/deserialize) + registration in the provider + use cases + store + views + routes.
- **Bootstrap order** (`src/main.ts`): the auth store resolves the initial Firebase auth state (and initializes repositories) **before** the router is installed and the app mounts. A global `beforeEach` redirects unauthenticated users to `/login` (the only route with `meta: { public: true }`).
- **Stores** are thin Pinia wrappers: they construct use cases on each call via `createUseCases()` (pulling repos from the provider), copy results into `ref`s, and push success/error messages through `notification-store` (rendered by `NotificationToast` in `App.vue`).
- **Sharing** (`src/views/sharing/SharingView.vue`, `firestore-sharing-repository.ts`): an owner grants access by writing the grantee's email to `users/{uid}/sharedEmails` and a reverse-index doc at `shares/{email}`. On login, the auth store resolves the **effective data owner uid** from `shares/{email}` — a shared user's repositories all point at the owner's data. `authStore.isDataOwner` distinguishes the two; `firestore.rules` enforces this model server-side (shared users cannot touch `sharedEmails`).

## Code Style

- **Prettier:** no semicolons, single quotes, 100-char print width, 2-space indent, LF
- **Linting:** OxLint runs first, then ESLint (configured to skip rules OxLint covers)
- Vue components use `<script setup lang="ts">`; Pinia stores use the composition/setup style (`defineStore` with a setup function)
- File naming: kebab-case for `.ts` files, PascalCase for `.vue` components
- User-facing strings are in Portuguese

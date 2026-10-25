# Frontend conventions

## Responsibilities

- `domain/models`: business data and repository input/output contracts. Transport-only response DTOs belong in `infrastructure/dtos`.
- `domain/repositories`: injectable abstract ports. All methods use camelCase.
- `application`: use cases, session services and state/facades. No component, HTTP client or toast-library imports.
- `infrastructure`: HTTP repositories, response mapping, storage and explicit demo implementations.
- `presentation`: pages, forms, UI components, view models and toast adapter. Pages orchestrate routing and feature actions. Reusable UI receives data and emits events; a feature dialog may call its feature facade.
- `shared`: small types and pure helpers used across features, such as pagination, error extraction and validators.

`WorkspaceStore` coordinates workspace list/detail/member/project updates. Its slices do not inject one another. `SessionService` owns the authenticated user; profile and auth share that signal. `SessionRefreshService` shares refresh requests within one application injector. Session termination cancels pending feature requests before resetting state.

## Requests and state

Use `StoreRequestRunner` for feature requests, with an operation-specific loading signal and a cancellation observable. It resets loading on success, error and cancellation and returns the subscription to the caller. Read requests that replace earlier requests cancel the previous request. Block duplicate submissions while a mutation is pending.

Capture the resource ID when starting a mutation. Update cached summaries by ID and update the open detail only when that ID still matches. UI callbacks must not navigate or close a new resource's dialog after an old request completes. Cancelling a client subscription does not roll back a server mutation; reopening the resource fetches fresh data.

For page reads, keep an explicit error state with retry. For mutations, show one toast by default; forms that display an inline error opt out with `toastOnError: false`. The notification port is implemented by `ToastNotificationService` in presentation.

Persisted workspace data has no Tailwind classes. `presentation/view-models/workspace.view-model.ts` derives initials and colors. Keep form state local; derive loading from the feature facade rather than duplicating booleans in the component. Reset forms when reopening a dialog or switching resources. Shared password validators follow the actual backend contracts; never trim a password.

## Naming and UI

- Pages: `name.page.ts/html`; components: `name.component.ts/html`; layouts: `name.layout.ts/html`.
- Stores: `feature.store.ts`; internal workspace state: `feature.slice.ts`.
- Use cases: `action.use-case.ts`; HTTP implementations: `feature-http.repository.ts`.
- Use kebab-case filenames and exact import casing. Keep the existing Tailwind/Material UI; component extraction preserves markup and styles.
- Split by a coherent responsibility, not an arbitrary line limit. Avoid a generic form/table framework for one-off screens.

The assistant still uses `MockAiAssistantService`, explicitly bound in `app.config.ts`. Recent boards and header notifications are demo fixtures in `infrastructure/mocks/layout.fixtures.ts`. Recent/pinned workspace projections are also UI placeholders, not persisted preferences. This refactor does not implement their backend features.

## Verification

Run `npm run check` for architecture/import casing, strict application and test type checking, formatting, and unit/component tests. Run `npm run build:dev` to verify browser/server bundles and the four prerendered public routes. `npm run build` uses production settings and may fetch remote fonts.

Add regression tests for state races, authentication, filtering/pagination and form behavior. Pure file moves and formatting do not need separate tests. Browser smoke checks against a running backend should cover login/returnUrl/logout, workspace switching/settings/member removal, and admin filtering and mutations.

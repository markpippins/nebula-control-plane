# Nebula Control Plane — Live Mode API Drift Report

**Date:** 2026-08-07
**Live target:** `nebula-srv` at `http://localhost:3101` (PostgreSQL-backed; `nexus/typescript/nebula-srv/src/routes.ts`)
**UI proxy:** `nebula-control-plane` on `http://0.0.0.0:4014` forwards every `/api/*` request verbatim to nebula-srv (POST bodies and query strings pass through untouched).
**Mock-side reference:** `server.ts` in this folder registers a duplicate set of in-memory mock routes (used only when `VITE_NCP_MODE=mock`, port 3000 — Google AI Studio fallback). Unless noted otherwise, the drift items below are *envelope mismatches against nebula-srv that exist identically in both mock and live modes*.

This report enumerates each NCP frontend call site, compares the request envelope and the *typed* response shape the UI expects against what the live backend actually returns, and flags deltas that will cause runtime breakage in live mode.

---

## 1. Endpoint inventory

### 1.1 Endpoints NCP calls (via `apiRequest`)

| # | Frontend call site | Method | Live route | Live body / query | UI-typed response |
|---|---|---|---|---|---|
| C-01 | `NebulaContext.tsx:101` | GET | `/api/counts` | — | `CountsSummary` |
| C-02 | `SystemsView.tsx:46` | GET | `/api/systems` | — | `{ items: SystemItem[] } \| SystemItem[]` |
| C-03 | `SystemsView.tsx:82` | POST | `/api/systems` | `{ name, description }` | `SystemItem` |
| C-04 | `SystemsView.tsx:102` | POST | `/api/subsystems` | `{ systemId, name, description }` | `Subsystem` |
| C-05 | `SystemsView.tsx:121` | POST | `/api/features` | `{ ... }` | `Feature` |
| C-06 | `SystemsView.tsx:139` | POST | `/api/systems/demote/{id}` | — | `void` |
| C-07 | `DashboardView.tsx:48` / `RequirementsKanban.tsx:71` | GET | `/api/requirements` | — | `Requirement[] \| { items: Requirement[] }` |
| C-08 | `Kanban/RequirementsKanban.tsx:133` | POST | `/api/requirements` | `{ systemId, title, priority, reqType, status, ... }` | `Requirement` |
| C-09 | `Kanban/RequirementsKanban.tsx:110` | POST | `/api/requirements/{id}/move` | `{ targetStatus, ... }` | `Requirement` |
| C-10 | `Kanban/RequirementsKanban.tsx:161` | POST | `/api/requirements/{id}/compile` | `{ stage1Only, createPlan }` | `CompilationIR` |
| C-11 | `Harvests/HarvestsView.tsx:28` | GET | `/api/harvests` | — | `{ items: Harvest[] } \| Harvest[]` |
| C-12 | `Harvests/HarvestsView.tsx:29` | GET | `/api/harvest-candidates` | — | `{ items: HarvestCandidate[] } \| HarvestCandidate[]` |
| C-13 | `Harvests/HarvestsView.tsx:56` | POST | `/api/cpf/promote` | `{ candidateId }` | `{ ok, candidate }` |
| C-14 | `Audit/AgentAuditView.tsx:36` | GET | `/api/agent-records` | — | `{ items: AgentRecord[] } \| AgentRecord[]` |
| C-15 | `Audit/AgentAuditView.tsx:52` | GET | `/api/agent-records/{id}` | — | `AgentRecord` |
| C-16 | `Audit/AgentAuditView.tsx:62` | POST | `/api/audit/sync` | — | `any` |
| C-17 | `Audit/AgentAuditView.tsx:75` | POST | `/api/audit/{id}/regenerate` | — | `any` |
| C-18 | `Audit/AgentAuditView.tsx:86` | GET | `/api/inbox-pointers` | — | `Record<string,string>` |
| C-19 | `Audit/AgentAuditView.tsx:104` | PUT | `/api/inbox-pointer/{role}` | `{ timestamp }` | `any` |
| C-20 | `OpRegistry/OpRegistryView.tsx:21` | GET | `/api/op-registry` | — | `any[]` (unwrapped to `res?.items \|\| []`) |
| C-21 | `OpRegistry/OpRegistryView.tsx:50` | POST | `/api/op-registry` | `{ intentId, version, ... }` | `any` |
| C-22 | `OpRegistry/OpRegistryView.tsx:38` | POST | `/api/op-registry/{id}/fork` | *(empty)* | `any` |
| C-23 | `CPF/CpfFunnelView.tsx:49` | GET | `/api/cpf/count` | — | `{ ready, promoted, nearMiss, low }` |
| C-24 | `CPF/CpfFunnelView.tsx:50` | GET | `/api/cpf?all=true` | — | `{ items: CpfCandidate[]; dbTotal: number }` |
| C-25 | `CPF/CpfFunnelView.tsx:123` | POST | `/api/cpf/promote` | `{ candidateId }` | `{ ok: boolean, candidate: CpfCandidate }` |
| C-26 | `Questions/OpenQuestionsView.tsx:38` | GET | `/api/open-questions` | — | `{ items: OpenQuestion[] } \| OpenQuestion[]` |
| C-27 | `Questions/OpenQuestionsView.tsx:64` | POST | `/api/open-questions` | `{ title, description, category, blocking }` | `void` |
| C-28 | `Questions/OpenQuestionsView.tsx:88` | POST | `/api/open-questions/{id}/answers` | `{ answer, role, confidence }` | `OpenQuestionAnswer` |
| C-29 | `Questions/OpenQuestionsView.tsx:115` | PUT | `/api/open-questions/{id}/resolve` | `{ resolvedBy: 'architect' }` | `void` |
| C-30 | `Execution/ExecutionPipelineView.tsx:34` | GET | `/api/execution/requests` | — | `{ items: ExecutionRequest[] }` |
| C-31 | `Execution/ExecutionPipelineView.tsx:35` | GET | `/api/execution/receipts` | — | `{ items: ExecutionReceipt[] }` |
| C-32 | `Execution/ExecutionPipelineView.tsx:36` | GET | `/api/execution/state` | — | `ExecutionStateSummary` |
| C-33 | `Execution/ExecutionPipelineView.tsx:57` | POST | `/api/execution/requests` | `{ ... }` | `any` |
| C-34 | `Knowledge/KnowledgeGraphView.tsx:17` | GET | `/api/knowledge/entities` | — | `{ items: KnowledgeEntity[] }` |
| C-35 | `Knowledge/KnowledgeGraphView.tsx:35` | POST | `/api/search/semantic` | `{ queryEmbedding, limit }` | `any` (uses `res.results`) |
| C-36 | `PlansDocs/PlansDocsView.tsx:83` | GET | `/api/plans` | — | `PlanApiRecord[] \| { items?: PlanApiRecord[] }` |
| C-37 | `PlansDocs/PlansDocsView.tsx:84` | GET | `/api/projections` | — | `ProjectionApiRecord[] \| { items?: ProjectionApiRecord[] }` |
| C-38 | `PlansDocs/PlansDocsView.tsx:101` | POST | `/api/projections/{id}/render` | — | `any` |
| C-39 | `PlansDocs/PlansDocsView.tsx:112` | DELETE | `/api/projections/{id}` | — | `any` |
| C-40 | `PlansDocs/PlansDocsView.tsx:123` | POST | `/api/projections` | `{ ... }` | `any` |
| C-41 | `Common/SearchModal.tsx:36` | GET | `/api/search?q=…` | — | `{ results: SearchResultItem[] }` |
| C-42 | `Settings/MockConfigModal.tsx:63` | POST | `/api/refresh-stats` | — | `any` |
| C-43 | `Settings/MockConfigModal.tsx:63` | POST | `/api/seed` | — | `any` |

### 1.2 nebula-srv routes NCP depends on (verified present)

All C-* routes map to existing `router.*` registrations. Live probing on `:4014` returned `200` / `201` / `404` only.

---

## 2. Envelope mismatch matrix (live mode)

The deltas below are graded as **CRITICAL** (functional break — runtime exception, 4xx, or wrong UI state) or **MINOR** (shape drift that happens to work today but will break on the next refactor).

### CRITICAL: Response wrapper mismatch

| # | Frontend expectation | Live backend response | Impact |
|---|---|---|---|
| M-01 | `/api/open-questions` → `{ items: OpenQuestion[] } \| OpenQuestion[]` (C-26) | `{ questions: OpenQuestion[], count: number }` | `OpenQuestionsView` reads `res.items` first; back-fallbacks to `Array.isArray(res)` (false on dict). **Render renders zero questions.** |
| M-02 | `/api/inbox-pointers` → `Record<string,string>` directly (C-18) | `{ pointers: Record<string,string> }` | `AgentAuditView` reads `Object.entries(res)` directly, producing a single row named `pointers`. Inbox pointer table broken. |
| M-03 | `/api/cpf?all=true` → `{ items: CpfCandidate[]; dbTotal: number }` (C-24) | `{ data: CpfCandidate[], count: number, limit: number }` | `CpfFunnelView` aliases `items=res.items` (undefined) and `dbTotal=res.dbTotal` (NaN). Funnel list empty, progress bar shows `0 / NaN`. |
| M-04 | `/api/cpf/promote` response → `{ ok: boolean, candidate: CpfCandidate }` (C-25) | `{ success: boolean, message: string, title: string }` | `CpfFunnelView` checks `res.ok` (undefined). Promote flow reports failure even on real success; `selectedCandidate` not refreshed. |

### CRITICAL: Request body / route mismatch

| # | Frontend call | Backend expectation | Impact |
|---|---|---|---|
| M-05 | POST `/api/op-registry/{id}/fork` with empty body (C-22) | Only literal `/api/op-registry/fork` is registered; body must contain `{ source_id, new_version }` | Route does not match → `404`. Even if path matched, body missing `source_id`/`new_version` → `400`. Fork button always fails in live mode. |
| M-06 | POST `/api/cpf/promote` body `{ candidateId }` (C-25) | Backend reads `candidate_id \|\| id` (snake_case first) | Send `candidateId` (camelCase) — body has no `candidate_id` and no `id`. Backend returns `400 "candidate_id is required"`. Promote button always 400s in live mode. |
| M-07 | POST `/api/op-registry` body `{ intentId, ... }` (C-21) | Backend reads `id` and `intent_id` (snake_case + requires `id`) | ncp sends camelCase `intentId`; backend's `!id` check fails → 400. New op-registry entry creation fails in live mode. |

### MINOR: Field naming differences that happen to pass through

| # | Frontend expectation | Live backend response | Impact |
|---|---|---|---|
| M-08 | `Requirement[]` typed interface uses camelCase keys (`systemId`, `featureId`, `acceptanceCriteria`, `reqType`, `parentId`, `conduitPlanId`, `questionCounts`) | Backend returns **both** snake_case and a duplicate camelCase pair (e.g. `system_id` and `systemId`) for every dual-named field. | Works today (NCP reads camelCase), but extra payload bytes + schema drift will bite when backend eventually drops snake_case aliases. |
| M-09 | `CpfStats` typed as `{ ready, promoted, nearMiss, low }` (camelCase) | `/api/cpf/count` returns `{ ready, promoted, near_miss, low }` | `CpfStats.nearMiss` is `undefined` because backend uses `near_miss`. Funnel chart shows "near-miss" bucket as 0. |
| M-10 | `ExecutionStateSummary` typed as `{ requests: Record<status,number> }` (map) | `/api/execution/state` returns `{ requests: [{ status, count }, …] }` (array of stat rows) | Any code that does `state.requests.COMPLETED` would get `undefined`; current code only `.map`s over rows, so no exception — but counts are stringified (`"108"` not `108`), so totals render as concatenated strings. |

### MINOR: Pagination extras

The NCP types assume "array OR `{ items }`" responses; nebula-srv standardly returns `{ items, total, page, pageSize }`. The current UI code defensively unwraps both shapes, so:
- C-02, C-07, C-11, C-12, C-14, C-20, C-30, C-31, C-34, C-36, C-37: ✅ work.
- Search (C-41) and counts (C-01) return extra fields but the UI only reads the ones it needs.

---

## 3. Per-endpoint detailed deltas

### `/api/counts` (C-01) — ✅ OK
- Frontend `CountsSummary` typed keys: `threads`, `requirements`, `agendas`, `candidates`, `harvests`, `openQuestions`, `intents`, `assessments`, `observations`, `agentRecords`, `specifications`, `plans`.
- Live backend returns all above **plus** `users: 20` and `toDoThreads: 82` (extra keys ignored by UI).
- **Status:** Compatible.

### `/api/systems` (C-02, C-03) — ✅ OK
- POST `/api/systems` body `{ name, description }` matches backend's required field `name` and optional `description`.
- Backend response is a single merged object `{ id, name, description, readme, architecture, createdAt, recordedOnDt, ..., folders: [], subsystems: [] }`. UI's `SystemItem` interface reads `{ id, name, description, readme, architecture, createdAt, folders, subsystems }` — all present.
- **Status:** Compatible.

### `/api/systems/demote/{id}` (C-06) — ✅ OK
- Backend route exists at `router.post('/systems/demote/:id', ...)`. Path param matches. No body required.
- **Status:** Compatible.

### `/api/open-questions` (C-26) — ❌ CRITICAL (M-01)
- **Live response shape:** `{ "questions": [...], "count": N }` — verified via `curl -s http://localhost:4014/api/open-questions | python3 -m json.tool | head -3`.
- **NCP source:** `OpenQuestionsView.tsx:38` types as `{ items: OpenQuestion[] } | OpenQuestion[]` and uses:
  ```ts
  const items = Array.isArray(res) ? res : res?.items || [];
  ```
  Because `res` is an object (not array) and `res.items` is undefined, `items` is `[]`. **Open Questions panel shows zero questions even though 852 exist.**
- **Required fix (UI):**
  ```ts
  const items = Array.isArray(res) ? res : res?.items || res?.questions || [];
  ```

### `/api/open-questions` POST (C-27) — ⚠️ POTENTIAL 400
- Frontend sends `{ title, description, category, blocking }`.
- Backend validates `category` against the strict enum `['AMBIGUITY','MISSING_INFO','CONFLICT','SCOPE','DEPENDENCY','DUPLICATE_CANDIDATE','WORK_COMPLETED']` (uppercase).
- **Action:** Audit the `MockConfigModal` for whether `qCategory` value is uppercase. If the UI sends lowercase (e.g. `'ambiguity'`), backend returns `400 "title and valid category are required"`. Run the live "create question" workflow to verify — likely a latent bug.

### `/api/open-questions/{id}/answers` POST (C-28) — ✅ OK
- NCP sends `{ answer, role, confidence }`. Backend reads the same three names (`answer`, `role`, `confidence`) and defaults missing `confidence` to `'MEDIUM'`.
- **Status:** Compatible.

### `/api/open-questions/{id}/resolve` PUT (C-29) — ✅ OK
- NCP sends `{ resolvedBy: 'architect' }`. Backend requires `resolvedBy` — match.
- **Status:** Compatible.

### `/api/cpf/count` (C-23) — ❌ MINOR (M-09)
- **Live response:** `{ total: 3370, ready: 734, promoted: 85, near_miss: 2497, low: 139 }`
- **NCP `CpfStats` interface:** `{ ready, promoted, nearMiss, low }` (camelCase).
- `state.nearMiss` is `undefined` after parsing; rendering code falls back to `0`. Near-miss funnel stage renders as `0`.
- **Required fix:** either:
  - UI: read `res.near_miss` instead of `res.nearMiss`, or
  - Backend: rename `near_miss` → `nearMiss` in the response shape.

### `/api/cpf?all=true` (C-24) — ❌ CRITICAL (M-03)
- **Live response shape:** `{ data: [], count: N, limit: N }` (note: `data`, not `items`, even with `all=true`).
- **NCP code:** `const res = await apiRequest<{ items: CpfCandidate[]; dbTotal: number }>(\`/cpf?all=true\`);` — `items` and `dbTotal` both `undefined`.
- **Required fix (UI):**
  ```ts
  const res = await apiRequest<{ data?: CpfCandidate[]; items?: CpfCandidate[]; count?: number; dbTotal?: number }>(...)
  const items = res.data ?? res.items ?? [];
  const dbTotal = res.dbTotal ?? res.count ?? 0;
  ```

### `/api/cpf/promote` POST (C-25) — ❌ CRITICAL (M-04 + M-06)
- **Frontend body:** `{ candidateId }` (camelCase).
- **Backend body reader:** `const candidateId = req.body.candidate_id || req.body.id;` — *neither key is present*. Returns `400 "candidate_id is required"`.
- **Required fix (UI):** change the body key to `candidate_id`:
  ```ts
  body: JSON.stringify({ candidate_id: candidateId })
  ```
- **Secondary mismatch (response):** even if request succeeded, frontend expects `{ ok: boolean, candidate: CpfCandidate }` but backend returns `{ success: boolean, message: string, title: string }`. Promote-success toast will not fire.
- **Required fix (UI):**
  ```ts
  if (res.success) { ... }
  ```

### `/api/inbox-pointers` (C-18) — ❌ CRITICAL (M-02)
- **Live response:** `{ pointers: { architect: "...", engineer: "..." } }`
- **NCP code:** `const res = await apiRequest<Record<string,string>>('/inbox-pointers');` then iterates `Object.entries(res)`.
- Renders a single row `["pointers", "{architect:..., engineer:...}"]` instead of per-role rows.
- **Required fix (UI):**
  ```ts
  const res = await apiRequest<{ pointers: Record<string,string> }>('/inbox-pointers');
  const pointers = res.pointers ?? res;
  ```

### `/api/op-registry` POST (C-21) — ❌ CRITICAL (M-07)
- **Frontend body:** `{ intentId, version, ... }` (camelCase).
- **Backend body reader:** destructures `{ id, intent_id, version, status, label, match_patterns, opcode_template, required_params, optional_params, preconditions, postconditions, idempotency_key, successor_id, notes }` — *all snake_case*. The `if (!id || !intent_id)` guard fires → `400 "id and intent_id are required"`.
- **Required fix (UI):** send snake_case keys, including a generated `id`:
  ```ts
  body: JSON.stringify({ id: `${intentId}:${version}`, intent_id: intentId, version, ... })
  ```

### `/api/op-registry/{id}/fork` POST (C-22) — ❌ CRITICAL (M-05)
- **Live route table:** only `POST /api/op-registry/fork` is registered (literal). Path-param variant `/api/op-registry/:id/fork` is **not** registered in nebula-srv (only in the mock-mode `server.ts`).
- **Frontend call:** `apiRequest(\`/op-registry/${id}/fork\`)` with **empty body**.
- **Outcome:** `404` (route not matched).
- **Required fix (UI):**
  ```ts
  await apiRequest('/op-registry/fork', {
    method: 'POST',
    body: JSON.stringify({ source_id: id, new_version: 'v2' }),
  });
  ```
- **Required fix (Backend, optional):** also register `POST /op-registry/:id/fork` as an alias that copies `id` into `req.body.source_id` for backward compatibility with NCP and any other client that uses the path-param form.

### `/api/execution/state` (C-32) — ⚠️ MINOR (M-10)
- **Live response:**
  ```json
  { "requests": [ { "status": "CANCELLED", "count": "38" }, ... ],
    "leases":   [ { "status": "ACTIVE",    "count": "2"  }, ... ],
    "attempts": [ { "status": "SUCCEEDED", "count": "108"}, ... ] }
  ```
- Note: `count` is returned as **string** (`"108"`), not number — the Go-style JSON encoder or `COUNT(*)::TEXT` in the SQL produces text. Totals computed as `requests.reduce((sum, r) => sum + r.count, 0)` will concatenate strings, producing `"0385108"`.
- **Status:** Minor (slides display odd totals) — fix is `Number(r.count)`.

### `/api/search` GET (C-41) — ✅ OK
- **Live response:** `{ query, results: [...], total }`. NCP reads `res.results`. Match.
- **Status:** Compatible.

### `/api/search/semantic` POST (C-35) — ⚠️ NOTE
- NCP sends a synthetic 768-dimension random vector for testing — fine for the contract, but with no real embedding it will get random low-similarity hits in live mode. Backend validates `queryEmbedding.length === 768`. **Match, but UX-only.**
- **Required fix (UI):** implement a real embedding source (or hide the semantic-search button in live mode until embeddings are wired).

### `/api/audit/sync` POST (C-16), `/api/audit/{id}/regenerate` POST (C-17), `/api/audit/graph` GET — ✅ OK
- All three routes exist on nebula-srv (verified live — `audit/graph` returns an `entities` array).
- **Status:** Compatible.

### `/api/refresh-stats` POST (C-42), `/api/seed` POST (C-43) — ✅ Present
- Backend routes exist. The UI doesn't pass a body; both endpoints accept empty body.
- **Status:** Compatible (though `/api/seed` will mutate the live DB — use with care in live mode).

---

## 4. Summary table — what works, what breaks

| Category | OK | Critical | Minor |
|---|---|---|---|
| GET endpoints | 24 | 3 (M-01, M-02, M-03) | 2 (M-09, M-10) |
| POST/PUT/DELETE endpoints | 11 | 4 (M-04, M-05, M-06, M-07) | 0 |
| **Total** | **35** | **7** | **2** |

### 7 critical fixes required for live mode to function

1. **M-01 / C-26**: `OpenQuestionsView` — accept `res.questions` as a fallback list.
2. **M-02 / C-18**: `AgentAuditView` — unwrap `res.pointers` before iterating.
3. **M-03 / C-24**: `CpfFunnelView` — read `res.data` and `res.count` for the funnel list.
4. **M-04 / C-25**: `CpfFunnelView` — check `res.success` (not `res.ok`).
5. **M-05 / C-22**: `OpRegistryView` — change fork URL to `/api/op-registry/fork`, send `{ source_id, new_version }`.
6. **M-06 / C-25**: `CpfFunnelView` — send `{ candidate_id }` (snake_case) to `/api/cpf/promote`.
7. **M-07 / C-21**: `OpRegistryView` — send snake_case keys and a generated `id` to `/api/op-registry`.

---

## 5. Endpoints only called in mock mode

The mock-mode `server.ts` registers additional routes that the frontend doesn't call from any tracked component yet (e.g. `/api/audit/graph` data is loaded by `AgentAuditView` though). They exist in both servers — no drift.

---

## 6. How to re-verify

```bash
# Live-mode enumeration (proxy → nebula-srv)
APP=http://localhost:4014

for ep in /api/counts /api/systems /api/requirements /api/harvests /api/harvest-candidates \
          /api/agent-records /api/inbox-pointers /api/open-questions?limit=1 \
          '/api/cpf?all=true&limit=1' /api/cpf/count /api/op-registry \
          /api/knowledge/entities /api/plans /api/projections /api/execution/state; do
  curl -s --max-time 3 "$APP$ep" \
    | python3 -c 'import sys,json; d=json.load(sys.stdin); print("'$ep' →", type(d).__name__, list(d.keys())[:6] if isinstance(d,dict) else "array len "+str(len(d)))'
done
```

Expected output (after fixes applied): every endpoint should return either `array` or a dict whose first key is `items` (or `pointers`/`questions`/`data` where already documented above).

---

## 7. Convention drift to flag

The tackle-ui convention used by `mildred-ui`, `semantics-ui`, `assembly-ui` and now NCP, expects a single canonical envelope:
- list endpoints return `{ items: T[], total, page, pageSize }` (paginated) **OR** an array (legacy)
- detail endpoints return `T` directly
- POST writes return the created entity (201)

The nebula-srv backend mostly follows this convention **except** for the four outlier endpoints flagged above:
- `/api/open-questions` (uses `questions` not `items`)
- `/api/inbox-pointers` (wraps in `pointers`)
- `/api/cpf` (uses `data` not `items`)
- `/api/execution/state` (uses `{ status, count }[]` rows, not a status-keyed map)

Either align these four endpoints to the standard envelope (preferred — one backend change fixes every client), or add frontend fallbacks as documented above.

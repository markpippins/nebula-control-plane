1. Requirements Dependency DAG & Hierarchy Management
GET / POST /api/requirements/:id/dependencies: Managing explicit dependency linkages between requirements (e.g., requirement A blocks requirement B).
GET /api/requirements/:id/children: Hierarchical parent-child requirement tree navigation.
PATCH /api/requirements/batch: Bulk status or assignment updates across multiple requirements simultaneously.
Current UI state: The Kanban board supports single-item drag-and-drop status moves and compilation triggers, but requirement dependency graphs and batch actions are not exposed.

2. System Documentation & Info Tabs
GET / PUT / DELETE /api/systems/:id/info/:tabId: Storing, editing, and deleting tabbed documentation or metadata attached to specific architectural systems.
Current UI state: The Systems view allows creating/demoting systems, subsystems, and features, but system-level tabbed detail documents cannot be created or edited.

3. Worker Execution Lease Management
POST /api/execution/leases/acquire
POST /api/execution/leases/:id/renew
POST /api/execution/leases/:id/release
POST /api/execution/attempts
Current UI state: The Execution Pipeline view displays active execution requests, receipts, and cluster state, but agent worker lease acquisition, renewal, and release mechanics operate strictly behind the scenes without manual UI controls.

4. Harvest Discovery & Direct Plan Spawning
POST /api/harvest-candidates/discover: Triggering automated candidate discovery routines.
POST /api/harvest-candidates/:id/spawn-plan & promote-to-plan: Directly spawning execution plans straight from harvest candidates.
Current UI state: The Harvests view supports promoting candidates to the Candidate Promotion Framework (CPF), but candidate discovery triggers and direct candidate-to-plan spawning are unexposed.

5. Knowledge Graph Edges & Evidence Link Verification
GET /api/knowledge/edges & GET /api/knowledge/summary
GET /api/cross-references & GET /api/evidence-links
Current UI state: The Knowledge view renders entity lists and supports semantic search, but explicit cross-reference traversal, graph edge relationships, and evidence link verification are not rendered as interactive elements.

6. Audit Graph Visualizer & Agent Record Search
GET /api/audit/graph: Retrieving the full DAG audit trail for lifecycle events.
POST /api/agent-records/search: Parametric multi-field search across historical agent logs.
Current UI state: The Audit view displays log records and inbox pointers, but multi-criteria record search and visual audit graph rendering are not wired up.

7. Server-Synced User Preferences
GET /api/preferences & PUT /api/preferences/:key
Current UI state: Theme switching and user configuration currently operate on localStorage state rather than persisting user settings to the backend database via the preferences API.

8. System Database Seeding & Import
POST /api/seed & POST /api/import
Current UI state: Backend reset or full workspace import operations are available via API endpoints but do not have dedicated UI modal actions.


Priorities:

1, 3, 4, 6, 5
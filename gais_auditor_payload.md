# AUDITOR PROMPT CONTEXT: APPLICATION DRIFT DETECTED IN [Nebula Control Plane]
System Directive: You are the designated API Auditor for the Nebula Control Plane system suite.
Analyze the raw structural git diffs attached below between our local engine baseline and the new layout engine pushes from GAIS.

## TARGET OBJECTIVES:
1. CONTRACT DRIFT: Identify newly declared or altered TypeScript interfaces in src/types/nebula.ts.
2. ENVELOPE MISMATCHES: Audit payload keys vs actual routing parameters between the NCP frontend (apiClient.ts) and the nebula-srv REST backend (:3101) that NCP proxies to in live mode.
3. UNIMPLEMENTED ROUTING: Explicitly call out components making apiRequests to paths that do not exist or differ from definitions in server.ts (the mock-mode Express server) or the real nebula-srv REST API (live mode).
4. SPECIFICATION OUTPUT: Draft the structured critique payload required by GAIS to bring the frontend and backend back into lockstep synchronization.

---

### 1. BACKEND ROUTE SURFACE CHANGES (server.ts)
```diff
```

### 2. CORE TYPE CONTRACT CHANGES (src/types/nebula.ts)
```diff
diff --git a/src/types/nebula.ts b/src/types/nebula.ts
index 136dbd0..6c01a9a 100644
--- a/src/types/nebula.ts
+++ b/src/types/nebula.ts
@@ -390,10 +390,31 @@ export interface CrossReference {
   relType: string;
   metadata?: Record<string, unknown>;
   createdAt: number;
 }
 
+export interface EvidenceLink {
+  id: string;
+  knowledgeEntityId: string;
+  nebulaHarvestId: string;
+  nebulaCandidateId: string;
+  linkType: string;
+  provenance: string;
+  confidence: number;
+  metadata?: Record<string, unknown>;
+  createdAt: number;
+}
+
+export interface KnowledgeSummary {
+  entityCount: number;
+  edgeCount: number;
+  crossReferenceCount: number;
+  bySection: Array<{ section: string; count: number }>;
+  byRelationType: Array<{ relation_type: string; count: number }>;
+  embeddingSummary: Array<{ section: string; entity_count: number; embedded_count: number }>;
+}
+
 export interface RoleDefinition {
   id: string;
   name: string;
   displayName: string;
   description: string;
```

### 3. FRONTEND VIEW COMPONENT CALL ENVELOPES (src/components)
```diff
+  Sparkles,
 } from 'lucide-react';
 import { useNebula } from '../../context/NebulaContext';
 import { apiRequest } from '../../services/apiClient';
 import { AgentRecord } from '../../types/nebula';
 
+interface AuditGraphEntity {
--
+++ b/src/components/Dashboard/DashboardView.tsx
@@ -29,6 +29,7 @@ import {
 import { useNebula } from '../../context/NebulaContext';
 import { apiRequest } from '../../services/apiClient';
 import { Requirement } from '../../types/nebula';
+import { DashboardWidget } from './DashboardWidget';
 
--
+  Radar,
+} from 'recharts';
+import { useNebula } from '../../context/NebulaContext';
+import { apiRequest } from '../../services/apiClient';
+import { Requirement, CpfStats } from '../../types/nebula';
+
+export type ChartViewMode = 'pipeline' | 'trend' | 'status' | 'radar';
--
+  Send,
 } from 'lucide-react';
 import { useNebula } from '../../context/NebulaContext';
 import { apiRequest } from '../../services/apiClient';
 import { ExecutionRequest, ExecutionReceipt, ExecutionStateSummary } from '../../types/nebula';
 
+interface ExecutionLease {
--
+  Rocket,
 } from 'lucide-react';
 import { useNebula } from '../../context/NebulaContext';
 import { apiRequest } from '../../services/apiClient';
@@ -21,6 +23,13 @@ export const HarvestsView: React.FC = () => {
   const [loading, setLoading] = useState<boolean>(true);
   const [activeTab, setActiveTab] = useState<'candidates' | 'transcripts'>('candidates');
--
+  SlidersHorizontal,
 } from 'lucide-react';
 import { useNebula } from '../../context/NebulaContext';
 import { apiRequest } from '../../services/apiClient';
-import { Requirement, RequirementStatus, SystemItem, CompilationIR } from '../../types/nebula';
+import { Requirement, RequirementStatus, SystemItem, CompilationIR, RequirementDependency } from '../../types/nebula';
 
--
+  X,
+} from 'lucide-react';
 import { useNebula } from '../../context/NebulaContext';
 import { apiRequest } from '../../services/apiClient';
-import { KnowledgeEntity } from '../../types/nebula';
+import {
+  KnowledgeEntity,
```

### 4. LIVE-MODE BACKEND REFERENCE (nebula-srv REST API)

nebula-srv source: `nexus/typescript/nebula-srv/src/routes.ts`
Routes are registered as `router.get/post/put/delete('/api/…')` — proxy passes paths verbatim.

See DRIFT_REPORT.md for the per-endpoint delta matrix (envelope shapes, status codes, missing routes).


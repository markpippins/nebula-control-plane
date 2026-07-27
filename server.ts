import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const app = express();
app.use(express.json());

const PORT = 3000;
const httpServer = createServer(app);

// ---------------------------------------------------------------------------
// In-Memory Database Store seeded with realistic Nebula Process Data
// ---------------------------------------------------------------------------

let systems: any[] = [
  {
    id: 'sys-core-001',
    name: 'Nebula Process Control Core',
    description: 'Core process control engine, execution pipeline, and state synchronization server.',
    readme: '# Nebula Process Control Core\nPrimary backend orchestration framework for autonomous agent compilation and deployment.',
    architecture: 'PostgreSQL (nebula schema) + Redis + Express REST + WebSockets',
    createdAt: Date.now() - 86400000 * 10,
    folders: [
      { id: 'fld-1', name: 'Compiler Tools', category: 'Tooling', note: 'WorkRequest IR & OP Registry compilers' },
      { id: 'fld-2', name: 'Security & Auth', category: 'Security', note: 'Internal cross-service token validators' },
    ],
    subsystems: [
      {
        id: 'sub-comp-01',
        systemId: 'sys-core-001',
        name: 'Compiler Subsystem',
        description: 'Translates requirement intents into executable opcode sequences.',
        readme: '# Compiler Subsystem\nStage 1 semantic normalization & Stage 2 engineering compilation.',
        color: '#6366f1',
        createdAt: Date.now() - 86400000 * 9,
        features: [
          {
            id: 'feat-ir-gen',
            subsystemId: 'sub-comp-01',
            name: 'WorkRequest IR Generator',
            description: 'Generates structured intermediate representations.',
            readme: null,
            createdAt: Date.now() - 86400000 * 8,
          },
          {
            id: 'feat-op-match',
            subsystemId: 'sub-comp-01',
            name: 'OP Registry Pattern Matcher',
            description: 'Regex & vector matcher against active OP sequences.',
            readme: null,
            createdAt: Date.now() - 86400000 * 8,
          },
        ],
      },
      {
        id: 'sub-exec-02',
        systemId: 'sys-core-001',
        name: 'Execution Lease Engine',
        description: 'Manages distributed leases, attempt receipts, and execution locks.',
        readme: '# Execution Engine\nHandles lease acquisition, TTL renewal, and receipt generation.',
        color: '#10b981',
        createdAt: Date.now() - 86400000 * 7,
        features: [
          {
            id: 'feat-lease-mgr',
            subsystemId: 'sub-exec-02',
            name: 'Lease Lock Manager',
            description: '300s TTL leases with active heartbeat renewal.',
            readme: null,
            createdAt: Date.now() - 86400000 * 6,
          },
        ],
      },
    ],
  },
  {
    id: 'sys-gui-002',
    name: 'Nebula IDE Workspace Interface',
    description: 'High-density desktop application UI component for process control and graph exploration.',
    readme: '# Nebula IDE UI\nReact + Tailwind high-contrast dark theme frontend.',
    architecture: 'Single Page Desktop Application with WebSocket real-time sync',
    createdAt: Date.now() - 86400000 * 5,
    folders: [],
    subsystems: [
      {
        id: 'sub-kanban-03',
        systemId: 'sys-gui-002',
        name: 'Kanban Lifecycle Board',
        description: 'Interactive 8-status requirement lifecycle management.',
        readme: null,
        color: '#f59e0b',
        createdAt: Date.now() - 86400000 * 4,
        features: [
          {
            id: 'feat-move-occ',
            subsystemId: 'sub-kanban-03',
            name: 'Optimistic Status Move',
            description: 'Row-locking optimistic concurrency validation.',
            readme: null,
            createdAt: Date.now() - 86400000 * 3,
          },
        ],
      },
    ],
  },
];

let requirements: any[] = [
  {
    id: 'req-101',
    systemId: 'sys-core-001',
    subsystemId: 'sub-comp-01',
    featureId: 'feat-ir-gen',
    title: 'Implement Stage 2 Opcode Resolver for File Operations',
    description: 'Map intent descriptions containing file modification paths directly to WRITE_FILE and VALIDATE_SYNTAX opcode sequences.',
    status: 'InProgress',
    priority: 'High',
    startDate: '2026-07-20',
    completionDate: null,
    parentId: null,
    reqType: 'Task',
    acceptanceCriteria: [
      'Parse affected files array from requirement payload',
      'Generate idempotency key via SHA-256 of opcode sequence',
      'Journal compile entry to agent_records',
    ],
    candidateId: 'cand-001',
    conduitPlanId: 'PLN-882',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'req-102',
    systemId: 'sys-core-001',
    subsystemId: 'sub-exec-02',
    featureId: 'feat-lease-mgr',
    title: 'Enforce 300s TTL on Execution Lease Renewal',
    description: 'Ensure active leases automatically release if lease renewal heartbeat is missed past 300 seconds.',
    status: 'Active',
    priority: 'Critical',
    startDate: '2026-07-22',
    completionDate: null,
    parentId: null,
    reqType: 'Story',
    acceptanceCriteria: [
      'Reject attempts submitted against expired leases with HTTP 404',
      'Emit RELEASED lease status to WebSocket channels',
    ],
    candidateId: 'cand-002',
    conduitPlanId: 'PLN-901',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 43200000,
  },
  {
    id: 'req-103',
    systemId: 'sys-gui-002',
    subsystemId: 'sub-kanban-03',
    featureId: 'feat-move-occ',
    title: 'Optimistic Kanban Card Drag & Drop with Conflict Guard',
    description: 'Provide instant UI update on card move, sending expectedCurrentStatus to detect concurrent edits.',
    status: 'Done',
    priority: 'Medium',
    startDate: '2026-07-18',
    completionDate: '2026-07-24',
    parentId: null,
    reqType: 'Task',
    acceptanceCriteria: [
      'Return HTTP 409 Conflict if expected status does not match server state',
      'Rollback optimistic UI state smoothly on failure',
    ],
    candidateId: null,
    conduitPlanId: 'PLN-750',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'req-104',
    systemId: 'sys-core-001',
    subsystemId: 'sub-comp-01',
    featureId: 'feat-op-match',
    title: 'Opcode Registry Version Forking Endpoint',
    description: 'Allow architects to fork existing active registry sequences into newer intent identifiers.',
    status: 'ToDo',
    priority: 'Medium',
    startDate: null,
    completionDate: null,
    parentId: null,
    reqType: 'Task',
    acceptanceCriteria: ['POST /api/op-registry/fork creates new version entry'],
    candidateId: null,
    conduitPlanId: null,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'req-105',
    systemId: 'sys-core-001',
    subsystemId: 'sub-comp-01',
    featureId: 'feat-ir-gen',
    title: 'Automated Intent Vector Indexing on Creation',
    description: 'Generate 768-dim embeddings for all new requirements to enable semantic similarity search.',
    status: 'Backlog',
    priority: 'Low',
    startDate: null,
    completionDate: null,
    parentId: null,
    reqType: 'Epic',
    acceptanceCriteria: ['Index title and synthesized intent in knowledge.graph_entities'],
    candidateId: null,
    conduitPlanId: null,
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'req-106',
    systemId: 'sys-core-001',
    subsystemId: 'sub-exec-02',
    featureId: 'feat-lease-mgr',
    title: 'WebSocket Broadcast on Lease Release',
    description: 'Notify connected clients instantly when an execution lease expires or is released by an executor.',
    status: 'Blocked',
    priority: 'High',
    startDate: null,
    completionDate: null,
    parentId: 'req-102',
    reqType: 'Bug',
    acceptanceCriteria: ['Client receives EXECUTION_UPDATED event within 50ms'],
    candidateId: null,
    conduitPlanId: null,
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'req-107',
    systemId: 'sys-gui-002',
    subsystemId: 'sub-kanban-03',
    featureId: 'feat-move-occ',
    title: 'Audit File Projection Markdown Viewer',
    description: 'Render system design audit markdown files with syntax highlighting and regeneration action.',
    status: 'Accepted',
    priority: 'Medium',
    startDate: '2026-07-15',
    completionDate: '2026-07-22',
    parentId: null,
    reqType: 'Story',
    acceptanceCriteria: ['POST /api/audit/:id/regenerate updates DB record from disk'],
    candidateId: null,
    conduitPlanId: 'PLN-610',
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'req-108',
    systemId: 'sys-core-001',
    subsystemId: 'sub-comp-01',
    featureId: 'feat-ir-gen',
    title: 'Deprecated Protocol Cleanup in System Demote',
    description: 'Ensure legacy protocols are properly archived when demoting a system into a subsystem.',
    status: 'Cancelled',
    priority: 'Low',
    startDate: null,
    completionDate: null,
    parentId: null,
    reqType: 'Task',
    acceptanceCriteria: ['Log demote transaction in agent_records'],
    candidateId: null,
    conduitPlanId: null,
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 6,
  },
];

let crossReferences: any[] = [
  {
    id: 'xref-01',
    sourceType: 'requirement',
    sourceId: 'req-106',
    targetType: 'requirement',
    targetId: 'req-102',
    relType: 'req:depends_on',
    metadata: { note: 'req-106 depends on TTL lease manager in req-102' },
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'xref-02',
    sourceType: 'requirement',
    sourceId: 'req-101',
    targetType: 'plan',
    targetId: 'PLN-882',
    relType: 'compiles_to',
    metadata: { compiledAt: Date.now() - 86400000 * 1 },
    createdAt: Date.now() - 86400000 * 1,
  },
];

let harvests: any[] = [
  {
    id: 'harv-101',
    sourcePath: '/docs/transcripts/session_2026_07_21.md',
    sourceFilename: 'session_2026_07_21.md',
    model: 'gemini-3.6-flash',
    totalCandidates: 3,
    tags: ['compiler', 'op_registry', 'architecture'],
    metadata: { sessionOwner: 'Architect' },
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    level: 1,
    visibilityScope: 'builder',
    sourceHash: 'a8f9c2d1e0',
    fileSize: 18420,
    version: 2,
    codeBlocks: 14,
    turns: 12,
    blocksPerTurn: 1.16,
    userTurns: 5,
  },
];

let harvestCandidates: any[] = [
  {
    id: "f0b9649e-0576-43a2-85a0-706dd06789d9",
    harvestId: "harv-101",
    title: "Requirement → WorkRequest Compilation Pipeline",
    intent_description: "Stage 2 compiler pass converting normalized intent criteria into executable opcode sequences.",
    intentDescription: "Stage 2 compiler pass converting normalized intent criteria into executable opcode sequences.",
    status: "promoted",
    compilation_readiness: 0.97,
    compilationReadiness: 0.97,
    completed: true,
    tags: ["compiler", "pipeline", "requirement"],
    system_name: "TypeSpec, Contracts & Code Generation",
    subsystem_name: "Compiler Pipeline",
    systemId: "sys-core-001",
    subsystemId: "sub-comp-01",
    featureId: "feat-ir-gen",
    dep_count: 0,
    promotable: true,
    harvest_source_filename: "session_2026_07_21.md",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    scoring_breakdown: {
      intent_filled: 0.20,
      hierarchy_mapped: 0.20,
      tagged: 0.10,
      has_artifacts: 0.20,
      deps_resolved: 0.20,
      reconciled: 0.07,
    }
  },
  {
    id: "cand-002-lease-timeout",
    harvestId: "harv-101",
    title: "Distributed Execution Lease Timeout Recovery",
    intent_description: "Automatic recovery and lock release of hanging execution tasks when lease owner heartbeat halts past 300s TTL.",
    intentDescription: "Automatic recovery and lock release of hanging execution tasks when lease owner heartbeat halts past 300s TTL.",
    status: "pending",
    compilation_readiness: 0.88,
    compilationReadiness: 0.88,
    completed: false,
    tags: ["execution", "leases", "ttl"],
    system_name: "Nebula Process Control Core",
    subsystem_name: "Execution Lease Engine",
    systemId: "sys-core-001",
    subsystemId: "sub-exec-02",
    featureId: "feat-lease-mgr",
    dep_count: 1,
    promotable: true,
    harvest_source_filename: "session_2026_07_21.md",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    scoring_breakdown: {
      intent_filled: 0.20,
      hierarchy_mapped: 0.20,
      tagged: 0.10,
      has_artifacts: 0.18,
      deps_resolved: 0.10,
      reconciled: 0.10,
    }
  },
  {
    id: "cand-003-vector-index",
    harvestId: "harv-101",
    title: "768-Dim Semantic Vector Index for Knowledge Entities",
    intent_description: "nomic-embed-text vector embedding pipeline generating similarity scores across 13 entity tables.",
    intentDescription: "nomic-embed-text vector embedding pipeline generating similarity scores across 13 entity tables.",
    status: "pending",
    compilation_readiness: 0.76,
    compilationReadiness: 0.76,
    completed: false,
    tags: ["vector", "knowledge", "embedding"],
    system_name: "Knowledge & Vector Memory Subsystem",
    subsystem_name: "Semantic Indexer",
    dep_count: 2,
    promotable: true,
    harvest_source_filename: "session_2026_07_22.md",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    scoring_breakdown: {
      intent_filled: 0.20,
      hierarchy_mapped: 0.17,
      tagged: 0.10,
      has_artifacts: 0.10,
      deps_resolved: 0.10,
      reconciled: 0.09,
    }
  },
  {
    id: "cand-004-op-fork",
    harvestId: "harv-101",
    title: "Opcode Registry Version Forking & Deprecation Guard",
    intent_description: "Allow architects to fork active opcode sequences into v2 while maintaining backward compatibility.",
    intentDescription: "Allow architects to fork active opcode sequences into v2 while maintaining backward compatibility.",
    status: "pending",
    compilation_readiness: 0.65,
    compilationReadiness: 0.65,
    completed: false,
    tags: ["opcodes", "registry"],
    system_name: "Opcode Registry & Pattern Matcher",
    subsystem_name: "Registry Versioning",
    dep_count: 3,
    promotable: false,
    harvest_source_filename: "session_2026_07_22.md",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    scoring_breakdown: {
      intent_filled: 0.20,
      hierarchy_mapped: 0.10,
      tagged: 0.10,
      has_artifacts: 0.10,
      deps_resolved: 0.10,
      reconciled: 0.05,
    }
  },
  {
    id: "cand-005-audit-proj",
    harvestId: "harv-101",
    title: "Filesystem Audit Projection Markdown Reader",
    intent_description: "Synchronize local filesystem markdown audit projection files into durable agent audit records.",
    intentDescription: "Synchronize local filesystem markdown audit projection files into durable agent audit records.",
    status: "linked",
    compilation_readiness: 0.54,
    compilationReadiness: 0.54,
    completed: false,
    tags: ["audit", "projections"],
    system_name: "Agent Audit & Journal Subsystem",
    subsystem_name: "Audit Projection Engine",
    dep_count: 1,
    promotable: false,
    harvest_source_filename: "session_2026_07_20.md",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    scoring_breakdown: {
      intent_filled: 0.20,
      hierarchy_mapped: 0.10,
      tagged: 0.03,
      has_artifacts: 0.10,
      deps_resolved: 0.05,
      reconciled: 0.06,
    }
  },
  {
    id: "cand-006-raw-transcript",
    harvestId: "harv-101",
    title: "Unstructured Transcript Log Fragment #108",
    intent_description: "",
    intentDescription: "",
    status: "pending",
    compilation_readiness: 0.32,
    compilationReadiness: 0.32,
    completed: false,
    tags: ["unparsed"],
    system_name: "Unassigned System",
    subsystem_name: "Raw Harvest",
    dep_count: 0,
    promotable: false,
    harvest_source_filename: "session_2026_07_19.md",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    scoring_breakdown: {
      intent_filled: 0.00,
      hierarchy_mapped: 0.00,
      tagged: 0.03,
      has_artifacts: 0.10,
      deps_resolved: 0.10,
      reconciled: 0.09,
    }
  },
];

// Dynamically generate the full ~1013 candidate set matching exact CPF Funnel distribution statistics
(function seedFullCpfDataset() {
  const systemNames = [
    "TypeSpec, Contracts & Code Generation",
    "Nebula Process Control Core",
    "Execution Lease Engine",
    "Nebula IDE Workspace Interface",
    "Knowledge & Vector Memory Subsystem",
    "Opcode Registry & Pattern Matcher",
    "Agent Audit & Journal Subsystem",
  ];

  const subsystemNames: Record<string, string[]> = {
    "TypeSpec, Contracts & Code Generation": ["Compiler Pipeline", "Type Spec Normalizer", "Code Generator"],
    "Nebula Process Control Core": ["State Synchronization", "Process Engine", "Orchestrator"],
    "Execution Lease Engine": ["Lease Manager", "TTL Monitor", "Attempt Receipt Log"],
    "Nebula IDE Workspace Interface": ["Kanban Board", "CPF Funnel View", "Role Deliberation"],
    "Knowledge & Vector Memory Subsystem": ["Semantic Indexer", "Graph Entity Sync", "Vector Store"],
    "Opcode Registry & Pattern Matcher": ["Registry Versioning", "Pattern Matcher", "Opcode Compiler"],
    "Agent Audit & Journal Subsystem": ["Audit Projection Engine", "Journal Writer", "Inspection Verifier"],
  };

  const tagPool = ["compiler", "pipeline", "execution", "vector", "audit", "kanban", "leases", "opcodes", "contracts", "ttl", "roles", "deliberation", "graph"];

  // Target counts matching 2026-07-03 pipeline state:
  // 0.90-1.00: 12
  // 0.80-0.89: 45
  // 0.70-0.79: 714
  // 0.60-0.69: 81
  // 0.50-0.59: 55
  // 0.00-0.49: 161
  // Total = 1068 candidate records (771 ready, 58 promoted)

  const bracketsSpec = [
    { min: 0.90, max: 1.00, count: 12, ready: true },
    { min: 0.80, max: 0.89, count: 45, ready: true },
    { min: 0.70, max: 0.79, count: 714, ready: true },
    { min: 0.60, max: 0.69, count: 81, ready: false },
    { min: 0.50, max: 0.59, count: 55, ready: false },
    { min: 0.00, max: 0.49, count: 161, ready: false },
  ];

  let candidateCounter = 10;
  let promotedTargetCount = 57; // 1 already in static seed = 58 total

  for (const b of bracketsSpec) {
    // Offset for items already created
    const existingInBracket = harvestCandidates.filter(
      (c) => c.compilation_readiness >= b.min && c.compilation_readiness <= b.max
    ).length;
    const needed = Math.max(0, b.count - existingInBracket);

    for (let i = 0; i < needed; i++) {
      candidateCounter++;
      const score = Math.round((b.min + Math.random() * (b.max - b.min)) * 100) / 100;
      const sysName = systemNames[candidateCounter % systemNames.length];
      const subsysList = subsystemNames[sysName] || ["General Subsystem"];
      const subsysName = subsysList[candidateCounter % subsysList.length];

      let isPromoted = false;
      if (b.ready && promotedTargetCount > 0 && Math.random() > 0.85) {
        isPromoted = true;
        promotedTargetCount--;
      }

      const tagsCount = score >= 0.6 ? 2 + (candidateCounter % 3) : score >= 0.4 ? 1 : 0;
      const candidateTags = [];
      for (let t = 0; t < tagsCount; t++) {
        candidateTags.push(tagPool[(candidateCounter + t) % tagPool.length]);
      }

      const isIntentFilled = score >= 0.4;
      const intentText = isIntentFilled
        ? `Automated operational intent candidate #${candidateCounter} specifying compiler contracts for ${subsysName}.`
        : "";

      harvestCandidates.push({
        id: `cand-${candidateCounter.toString().padStart(4, "0")}`,
        harvestId: "harv-101",
        title: `${sysName} — Candidate Task #${candidateCounter}`,
        intent_description: intentText,
        intentDescription: intentText,
        status: isPromoted ? "promoted" : score >= 0.7 ? "pending" : score >= 0.5 ? "linked" : "pending",
        compilation_readiness: score,
        compilationReadiness: score,
        completed: isPromoted,
        tags: candidateTags,
        system_name: sysName,
        subsystem_name: subsysName,
        dep_count: candidateCounter % 4,
        promotable: score >= 0.7,
        harvest_source_filename: `harvest_session_${100 + (candidateCounter % 15)}.md`,
        createdAt: new Date(Date.now() - 86400000 * (candidateCounter % 30)).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * (candidateCounter % 48)).toISOString(),
        scoring_breakdown: {
          intent_filled: isIntentFilled ? 0.20 : 0.00,
          hierarchy_mapped: sysName !== "Unassigned System" ? 0.20 : 0.00,
          tagged: candidateTags.length >= 2 ? 0.10 : candidateTags.length === 1 ? 0.03 : 0.00,
          has_artifacts: score >= 0.6 ? 0.20 : score >= 0.4 ? 0.10 : 0.00,
          deps_resolved: score >= 0.7 ? 0.20 : 0.10,
          reconciled: Math.round((score * 0.1) * 100) / 100,
        },
      });
    }
  }
})();

let openQuestions: any[] = [
  {
    id: 'q-201',
    title: 'Should the Stage 2 Compiler execute automatic rollback on syntax validation failure?',
    description: 'When an opcode sequence encounters a syntax validation error during execution, should all prior file writes in the WorkRequest IR transaction be automatically reverted?',
    category: 'AMBIGUITY',
    status: 'OPEN',
    blocking: true,
    createdBy: 'architect',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    requirementId: 'req-101',
    candidateId: 'cand-001',
    entityType: 'requirement',
    entityId: 'req-101',
    entityTitle: 'Implement Stage 2 Opcode Resolver for File Operations',
    answers: [
      {
        id: 'ans-1',
        questionId: 'q-201',
        role: 'architect',
        answer: 'Yes, transactional rollback is required to keep workspace files consistent.',
        confidence: 'HIGH',
        reasoning: 'Unvalidated code breaks build pipelines.',
        answeredAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
    ],
  },
  {
    id: 'q-202',
    title: 'What max retry policy should apply to network timeout execution failures?',
    description: 'Execution requests failed due to transient socket errors currently retry indefinitely.',
    category: 'DEPENDENCY',
    status: 'OPEN',
    blocking: false,
    createdBy: 'engineer',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    requirementId: 'req-102',
    candidateId: null,
    entityType: 'requirement',
    entityId: 'req-102',
    entityTitle: 'Enforce 300s TTL on Execution Lease Renewal',
    answers: [],
  },
];

let executionRequests: any[] = [
  {
    id: 'exec-req-01',
    businessKey: 'EXEC-COMPILE-REQ-101',
    title: 'Compile and Register WorkRequest IR for Req-101',
    intentType: 'task',
    objective: 'Generate opcode sequence for multi-file stage 2 compiler pass.',
    inputs: { targetReq: 'req-101', dryRun: false },
    deterministic: true,
    maxRetries: 3,
    timeoutPolicy: '300s',
    resourceHints: ['compiler', 'op_registry'],
    opTrace: { step1: 'stage1_normalize', step2: 'stage2_op_match' },
    status: 'RUNNING',
    sourcePlanId: 'PLN-882',
    sourceWrId: 'wr-101',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: 'exec-req-02',
    businessKey: 'EXEC-AUDIT-SYNC-001',
    title: 'Audit Directory Projection Upsert',
    intentType: 'sync',
    objective: 'Re-scan filesystem audit directory and insert current markdown snapshots.',
    inputs: { auditPath: '/nexus/audit' },
    deterministic: true,
    maxRetries: 1,
    timeoutPolicy: '60s',
    resourceHints: ['filesystem'],
    opTrace: {},
    status: 'SUCCEEDED',
    sourcePlanId: null,
    sourceWrId: null,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

let executionReceipts: any[] = [
  {
    id: 'rec-01',
    attemptId: 'att-101',
    requestId: 'exec-req-02',
    type: 'EXECUTION_COMPLETE',
    agentRole: 'inspector',
    summary: 'Successfully upserted 10 audit markdown snapshot records.',
    metadata: { durationMs: 420, filesCount: 10 },
    issuedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

let agentRecords: any[] = [
  {
    id: 'rec-agent-01',
    recordType: 'report',
    role: 'architect',
    title: 'Architectural Verification of Nebula Compiler Stage 2 IR',
    content: `## Architectural Verification\n\nThe Stage 2 Opcode Resolver successfully integrates with \`nebula.op_registry\` version 1.\n\nKey verifications:\n- **Idempotency Key**: SHA-256 generation ensures repeat compilations match existing plans.\n- **Dependencies**: Handled via \`nebula.cross_references\` with \`compiles_to\` relationship.`,
    sourcePath: '/docs/architecture/compiler_report.md',
    tags: ['architecture', 'compiler', 'verification'],
    systemId: 'sys-core-001',
    subsystemId: 'sub-comp-01',
    featureId: 'feat-ir-gen',
    planRef: 'PLN-882',
    level: 1,
    visibilityScope: 'builder',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'rec-agent-02',
    recordType: 'engineering_log',
    role: 'engineer',
    title: 'Kanban Concurrency Lock Test Log',
    content: `Verified status transition with \`expectedCurrentStatus\` lock in \`POST /api/requirements/:id/move\`.\nDetected 1 conflict during stress test and verified HTTP 409 response payload.`,
    sourcePath: null,
    tags: ['kanban', 'concurrency', 'testing'],
    systemId: 'sys-gui-002',
    subsystemId: 'sub-kanban-03',
    featureId: 'feat-move-occ',
    planRef: 'PLN-750',
    level: 2,
    visibilityScope: 'all',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

let opRegistry: any[] = [
  {
    id: 'op-001',
    intentId: 'WRITE_FILE',
    version: 1,
    label: 'Standard File Write Opcode Sequence',
    description: 'Creates or updates workspace files followed by syntax check.',
    notes: 'Primary opcode for single-file mutations.',
    opSequence: ['CHECK_FILE_EXISTS', 'WRITE_FILE', 'VALIDATE_SYNTAX'],
    status: 'active',
    metadata: { pattern: 'write_file' },
    deletedAt: null,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'op-002',
    intentId: 'EXECUTE_LEASE_ACQUIRE',
    version: 1,
    label: 'Distributed Lease Acquisition',
    description: 'Acquires 300s TTL execution lock on work requests.',
    notes: 'Used by worker node before task launch.',
    opSequence: ['VERIFY_NO_ACTIVE_LEASE', 'ACQUIRE_LEASE_LOCK', 'EMIT_LEASE_ACQUIRED_EVENT'],
    status: 'active',
    metadata: { ttl: 300 },
    deletedAt: null,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
];

let plans: any[] = [
  {
    id: 'PLN-882',
    title: 'Stage 2 WorkRequest Opcode Generation',
    goal: 'Automate conversion of requirement specifications into executable opcodes.',
    content: '# PLN-882 Implementation Plan\n\n1. Normalizing intent payload.\n2. Matching against OP registry patterns.\n3. Creating cross-reference links.',
    files_affected: ['src/compiler/stage2.ts', 'src/db/op_registry.ts'],
    acceptance_criteria: ['Generated opcode sequence passes syntax validation', 'Idempotency key stored in DB'],
    dependencies: [],
    status: 'in_progress',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    sizeBytes: 1240,
  },
  {
    id: 'PLN-750',
    title: 'Kanban Concurrency Lock Guard',
    goal: 'Prevent lost updates during drag-and-drop requirement status changes.',
    content: '# PLN-750 Implementation Plan\n\nOptimistic UI concurrency lock implementation.',
    files_affected: ['src/components/Kanban/Board.tsx', 'server.ts'],
    acceptance_criteria: ['Return HTTP 409 on status mismatch'],
    dependencies: [],
    status: 'done',
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    sizeBytes: 850,
  },
];

let knowledgeEntities: any[] = [
  {
    id: 'k-ent-01',
    section: 'compiler',
    entityId: 'ent-stage2-ir',
    name: 'WorkRequest Intermediate Representation',
    entityType: 'ArchitectureConcept',
    status: 'ACTIVE',
    descriptionAbbr: 'Structured JSON representation containing opcode sequence, affected files, and idempotency key.',
    description: 'The WorkRequest IR serves as the bridge between human-authored requirement intents and automated agent execution steps.',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'k-ent-02',
    section: 'execution',
    entityId: 'ent-lease-ttl',
    name: 'Distributed Execution Lease',
    entityType: 'SecurityConcept',
    status: 'ACTIVE',
    descriptionAbbr: 'Short-lived 300s TTL lock ensuring single-executor task execution.',
    description: 'Execution leases protect tasks from duplicate parallel executions across distributed agent nodes.',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

let userPreferences: Record<string, unknown> = {
  theme: 'dark',
  kanbanView: 'canonical',
  refreshIntervalMs: 5000,
  autoCompileOnToDo: true,
};

let roles: any[] = [
  {
    id: 'role-arch-01',
    name: 'architect',
    displayName: 'Architect',
    description: 'Owns architecture decisions, generates specifications, and verifies compilation IRs.',
    ownsDomains: ['architecture_decisions', 'specifications', 'compiler'],
    canGreenlight: true,
    canCreateQuestions: true,
    canCreateAgendas: true,
    canResolveQuestions: true,
    canVerifyWorkRequests: true,
    maxOpenQuestions: null,
    requiresApprovalFrom: [],
    cronEnabled: true,
    cronExpression: '0 * * * *',
    cronDescription: 'Hourly architect analysis pass',
    escalatesTo: ['topologist'],
    escalationTriggers: ['topology_conflict'],
    levelFilterPrimary: 'level <= 3',
    levelFilterAllowed: 'level = 4',
    visibilityScope: ['architect', 'all'],
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'role-eng-02',
    name: 'engineer',
    displayName: 'Software Engineer',
    description: 'Executes work requests, implements opcode sequences, and submits execution receipts.',
    ownsDomains: ['code_implementation', 'execution'],
    canGreenlight: false,
    canCreateQuestions: true,
    canCreateAgendas: false,
    canResolveQuestions: true,
    canVerifyWorkRequests: true,
    maxOpenQuestions: 5,
    requiresApprovalFrom: ['architect'],
    cronEnabled: false,
    cronExpression: null,
    cronDescription: null,
    escalatesTo: ['architect'],
    escalationTriggers: ['compilation_failure'],
    levelFilterPrimary: 'level <= 2',
    levelFilterAllowed: 'level <= 4',
    visibilityScope: ['builder', 'all'],
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

// Helper to normalize requirement status
function normalizeStatus(inputStatus: string): string {
  const s = (inputStatus || '').toLowerCase().trim();
  if (['backlog', 'new'].includes(s)) return 'Backlog';
  if (['todo', 'to-do', 'to do'].includes(s)) return 'ToDo';
  if (['inprogress', 'in progress', 'in-progress', 'in_progress', 'wip'].includes(s)) return 'InProgress';
  if (['active'].includes(s)) return 'Active';
  if (['blocked'].includes(s)) return 'Blocked';
  if (['done', 'complete', 'completed', 'resolved'].includes(s)) return 'Done';
  if (['cancelled', 'cancel', 'canceled'].includes(s)) return 'Cancelled';
  if (['accepted', 'accept'].includes(s)) return 'Accepted';
  return 'Backlog';
}

// ---------------------------------------------------------------------------
// WebSocket Broadcasting Setup
// ---------------------------------------------------------------------------

const wss = new WebSocketServer({ noServer: true });
const connectedClients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  connectedClients.add(ws);
  
  // Send welcome & initial client count
  ws.send(
    JSON.stringify({
      type: 'CONNECTED',
      payload: {
        message: 'Connected to Nebula Process Control Real-Time Engine',
        connectedClients: connectedClients.size,
        timestamp: new Date().toISOString(),
      },
    })
  );

  broadcastEvent('CLIENT_JOINED', { activeClients: connectedClients.size });

  ws.on('message', (messageData) => {
    try {
      const parsed = JSON.parse(messageData.toString());
      if (parsed.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
      }
    } catch (e) {
      // Ignore malformed WS frames
    }
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
    broadcastEvent('CLIENT_LEFT', { activeClients: connectedClients.size });
  });
});

function broadcastEvent(type: string, payload: unknown) {
  const message = JSON.stringify({
    type,
    payload,
    timestamp: new Date().toISOString(),
  });
  for (const client of connectedClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Attach WS upgrade handler to HTTP Server
httpServer.on('upgrade', (request, socket, head) => {
  if (request.url?.startsWith('/ws') || request.url === '/') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

// ---------------------------------------------------------------------------
// REST API Endpoint Definitions (matching nebula-srv spec)
// ---------------------------------------------------------------------------

// 2. Health Check
app.get(['/health', '/api/health'], (req, res) => {
  res.json({ status: 'ok', db: true, activeWsClients: connectedClients.size });
});

// 29. Counts
app.get('/api/counts', (req, res) => {
  res.json({
    threads: 12,
    requirements: requirements.length,
    agendas: 3,
    candidates: harvestCandidates.length,
    harvests: harvests.length,
    openQuestions: openQuestions.length,
    intents: opRegistry.length,
    assessments: 8,
    observations: 15,
    agentRecords: agentRecords.length,
    specifications: 6,
    plans: plans.length,
    users: 10,
  });
});

// 3. Systems
app.get('/api/systems', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 100;
  res.json({
    items: systems,
    total: systems.length,
    page,
    pageSize,
  });
});

app.get('/api/systems/:id', (req, res) => {
  const sys = systems.find((s) => s.id === req.params.id);
  if (!sys) return res.status(404).json({ error: 'System not found' });
  res.json(sys);
});

app.post('/api/systems', (req, res) => {
  const { name, description, readme, architecture } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const newSys = {
    id: `sys-${Date.now()}`,
    name,
    description: description || '',
    readme: readme || null,
    architecture: architecture || null,
    createdAt: Date.now(),
    folders: [],
    subsystems: [],
  };
  systems.push(newSys);
  broadcastEvent('SYSTEM_ADDED', newSys);
  res.status(201).json(newSys);
});

app.patch('/api/systems/:id', (req, res) => {
  const sys = systems.find((s) => s.id === req.params.id);
  if (!sys) return res.status(404).json({ error: 'System not found' });

  if (req.body.name !== undefined) sys.name = req.body.name;
  if (req.body.description !== undefined) sys.description = req.body.description;
  if (req.body.readme !== undefined) sys.readme = req.body.readme;
  if (req.body.architecture !== undefined) sys.architecture = req.body.architecture;

  broadcastEvent('SYSTEM_UPDATED', sys);
  res.json(sys);
});

app.delete('/api/systems/:id', (req, res) => {
  systems = systems.filter((s) => s.id !== req.params.id);
  requirements = requirements.filter((r) => r.systemId !== req.params.id);
  broadcastEvent('SYSTEM_DELETED', { id: req.params.id });
  res.json({ ok: true });
});

// 4. Subsystems
app.post('/api/subsystems', (req, res) => {
  const { systemId, name, description, readme } = req.body;
  if (!systemId || !name) return res.status(400).json({ error: 'systemId and name required' });

  const sys = systems.find((s) => s.id === systemId);
  if (!sys) return res.status(404).json({ error: 'Target system not found' });

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#3b82f6'];
  const newSub = {
    id: `sub-${Date.now()}`,
    systemId,
    name,
    description: description || '',
    readme: readme || null,
    color: colors[sys.subsystems.length % colors.length],
    createdAt: Date.now(),
    features: [],
  };
  sys.subsystems.push(newSub);
  broadcastEvent('SUBSYSTEM_ADDED', newSub);
  res.status(201).json(newSub);
});

// 12. Demote System
app.post('/api/systems/demote/:id', (req, res) => {
  const { targetSystemId } = req.body;
  const sourceSysIndex = systems.findIndex((s) => s.id === req.params.id);
  if (sourceSysIndex === -1) return res.status(404).json({ error: 'Source system not found' });

  const targetSys = systems.find((s) => s.id === targetSystemId);
  if (!targetSys) return res.status(404).json({ error: 'Target system not found' });

  const [sourceSys] = systems.splice(sourceSysIndex, 1);
  const newSubsystemId = `sub-${Date.now()}`;

  const demotedSub = {
    id: newSubsystemId,
    systemId: targetSystemId,
    name: sourceSys.name,
    description: sourceSys.description,
    readme: sourceSys.readme,
    color: '#f59e0b',
    createdAt: Date.now(),
    features: sourceSys.subsystems.map((sub: any) => ({
      id: `feat-demoted-${sub.id}`,
      subsystemId: newSubsystemId,
      name: sub.name,
      description: sub.description,
      readme: sub.readme,
      createdAt: Date.now(),
    })),
  };

  targetSys.subsystems.push(demotedSub);

  // Update requirements
  requirements.forEach((r) => {
    if (r.systemId === sourceSys.id) {
      r.systemId = targetSystemId;
      r.subsystemId = newSubsystemId;
    }
  });

  broadcastEvent('SYSTEM_DEMOTED', { sourceId: sourceSys.id, targetId: targetSystemId });
  res.json({ ok: true, newSubsystemId });
});

// 5. Features
app.post('/api/features', (req, res) => {
  const { subsystemId, name, description, readme } = req.body;
  if (!subsystemId || !name) return res.status(400).json({ error: 'subsystemId and name required' });

  for (const sys of systems) {
    const sub = sys.subsystems.find((s: any) => s.id === subsystemId);
    if (sub) {
      const newFeat = {
        id: `feat-${Date.now()}`,
        subsystemId,
        name,
        description: description || '',
        readme: readme || null,
        createdAt: Date.now(),
      };
      sub.features.push(newFeat);
      broadcastEvent('FEATURE_ADDED', newFeat);
      return res.status(201).json(newFeat);
    }
  }
  res.status(404).json({ error: 'Subsystem not found' });
});

// 6. Requirements
app.get('/api/requirements', (req, res) => {
  let result = [...requirements];
  if (req.query.systemId) {
    result = result.filter((r) => r.systemId === req.query.systemId);
  }
  if (req.query.subsystemId) {
    result = result.filter((r) => r.subsystemId === req.query.subsystemId);
  }
  if (req.query.featureId) {
    result = result.filter((r) => r.featureId === req.query.featureId);
  }
  result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.json(result);
});

app.get('/api/requirements/:id/children', (req, res) => {
  const children = requirements.filter((r) => r.parentId === req.params.id);
  res.json(children);
});

app.post('/api/requirements', (req, res) => {
  const {
    systemId,
    subsystemId,
    featureId,
    title,
    description,
    status,
    priority,
    startDate,
    completionDate,
    parentId,
    reqType,
    acceptanceCriteria,
    candidateId,
  } = req.body;

  if (!systemId || !title) return res.status(400).json({ error: 'systemId and title are required' });

  const normStatus = normalizeStatus(status || 'Backlog');

  const newReq = {
    id: `req-${Date.now()}`,
    systemId,
    subsystemId: subsystemId || null,
    featureId: featureId || null,
    title,
    description: description || '',
    status: normStatus,
    priority: priority || 'Medium',
    startDate: startDate || null,
    completionDate: completionDate || null,
    parentId: parentId || null,
    reqType: reqType || 'Task',
    acceptanceCriteria: acceptanceCriteria || [],
    candidateId: candidateId || null,
    conduitPlanId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  requirements.push(newReq);
  broadcastEvent('REQUIREMENT_CREATED', newReq);
  res.status(201).json(newReq);
});

// 8. Requirement Kanban Moves (With Optimistic Concurrency Lock)
app.post('/api/requirements/:id/move', (req, res) => {
  const { targetStatus, expectedCurrentStatus } = req.body;
  if (!targetStatus) return res.status(400).json({ error: 'targetStatus is required' });

  const reqObj = requirements.find((r) => r.id === req.params.id);
  if (!reqObj) return res.status(404).json({ error: 'Requirement not found' });

  const canonicalTarget = normalizeStatus(targetStatus);

  // Check optimistic concurrency lock if passed
  if (expectedCurrentStatus) {
    const canonicalExpected = normalizeStatus(expectedCurrentStatus);
    if (reqObj.status !== canonicalExpected) {
      return res.status(409).json({
        error: 'Current status does not match expectedCurrentStatus',
        currentStatus: reqObj.status,
        expectedCurrentStatus: canonicalExpected,
      });
    }
  }

  reqObj.status = canonicalTarget;
  reqObj.updatedAt = Date.now();

  // If transitioned to ToDo, auto-compile simulation
  let compilationEvent = null;
  if (canonicalTarget === 'ToDo') {
    compilationEvent = {
      stage: 2,
      intent_id: `REQ-${reqObj.id}`,
      status: 'AUTO_COMPILED',
      plan_number: `PLN-${Math.floor(100 + Math.random() * 900)}`,
    };
    reqObj.conduitPlanId = compilationEvent.plan_number;
  }

  broadcastEvent('REQUIREMENT_MOVED', {
    requirement: reqObj,
    compilationEvent,
  });

  res.json(reqObj);
});

// Batch status update
app.patch('/api/requirements/batch', (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || !status) return res.status(400).json({ error: 'ids array and status required' });

  const normStatus = normalizeStatus(status);
  let count = 0;
  for (const id of ids) {
    const item = requirements.find((r) => r.id === id);
    if (item) {
      item.status = normStatus;
      item.updatedAt = Date.now();
      count++;
    }
  }

  broadcastEvent('REQUIREMENTS_BATCH_UPDATED', { ids, status: normStatus });
  res.json({ ok: true, updated: count });
});

app.patch('/api/requirements/:id', (req, res) => {
  const reqObj = requirements.find((r) => r.id === req.params.id);
  if (!reqObj) return res.status(404).json({ error: 'Requirement not found' });

  Object.assign(reqObj, req.body);
  if (req.body.status) {
    reqObj.status = normalizeStatus(req.body.status);
  }
  reqObj.updatedAt = Date.now();

  broadcastEvent('REQUIREMENT_UPDATED', reqObj);
  res.json(reqObj);
});

app.delete('/api/requirements/:id', (req, res) => {
  requirements = requirements.filter((r) => r.id !== req.params.id);
  broadcastEvent('REQUIREMENT_DELETED', { id: req.params.id });
  res.json({ ok: true });
});

// 9. Requirement Compilation (WorkRequest IR Compiler)
app.post('/api/requirements/:id/compile', (req, res) => {
  const reqObj = requirements.find((r) => r.id === req.params.id);
  if (!reqObj) return res.status(404).json({ error: 'Requirement not found' });

  const sys = systems.find((s) => s.id === reqObj.systemId);
  const planNumber = `PLN-${Math.floor(100 + Math.random() * 900)}`;

  reqObj.conduitPlanId = planNumber;

  const resultPayload = {
    ok: true,
    stage: 2,
    stage1: {
      title: reqObj.title,
      description: reqObj.description,
      systemName: sys?.name || 'System',
      acceptanceCriteriaNormalized: Array.isArray(reqObj.acceptanceCriteria)
        ? reqObj.acceptanceCriteria
        : ['Criteria 1 passed'],
      synthesizedIntent: `Automated opcode execution for ${reqObj.title}`,
    },
    stage2: {
      requirement_id: reqObj.id,
      intent_id: `REQ-${reqObj.id}`,
      registry_version: 'v1.0',
      op_sequence: ['CHECK_FILES', 'WRITE_FILE', 'VALIDATE_SYNTAX', 'CREATE_PLAN_XREF'],
      files_affected: [`src/${reqObj.title.toLowerCase().replace(/\s+/g, '_')}.ts`],
      dependencies: [],
      acceptance_criteria: Array.isArray(reqObj.acceptanceCriteria) ? reqObj.acceptanceCriteria : [],
      idempotency_key: `hash-${Date.now()}`,
      matched_op_registry_id: opRegistry[0]?.id || null,
    },
    journal_entry_id: `agent-rec-${Date.now()}`,
    plan_number: planNumber,
  };

  // Add agent record journal entry
  agentRecords.unshift({
    id: resultPayload.journal_entry_id,
    recordType: 'engineering_log',
    role: 'architect',
    title: `Compilation IR for Requirement: ${reqObj.title}`,
    content: `Stage 2 compilation generated opcode sequence for plan ${planNumber}.`,
    sourcePath: null,
    tags: ['compiler', 'opcodes'],
    systemId: reqObj.systemId,
    subsystemId: reqObj.subsystemId || null,
    featureId: reqObj.featureId || null,
    planRef: planNumber,
    level: 1,
    visibilityScope: 'builder',
    createdAt: new Date().toISOString(),
  });

  broadcastEvent('REQUIREMENT_COMPILED', resultPayload);
  res.json(resultPayload);
});

// 7. Dependencies
app.get('/api/requirements/:id/dependencies', (req, res) => {
  const items = crossReferences.filter(
    (x) => x.sourceId === req.params.id || x.targetId === req.params.id
  );
  res.json({ items, total: items.length, page: 1, pageSize: 100 });
});

app.post('/api/requirements/:id/dependencies', (req, res) => {
  const { targetId, relType } = req.body;
  if (!targetId) return res.status(400).json({ error: 'targetId is required' });

  const newRef = {
    id: `xref-${Date.now()}`,
    sourceType: 'requirement',
    sourceId: req.params.id,
    targetType: 'requirement',
    targetId,
    relType: relType || 'req:blocks',
    metadata: {},
    createdAt: Date.now(),
  };

  crossReferences.push(newRef);
  broadcastEvent('DEPENDENCY_ADDED', newRef);
  res.status(201).json(newRef);
});

// 19. Harvests
app.get('/api/harvests', (req, res) => {
  res.json({ items: harvests, total: harvests.length, page: 1, pageSize: 100, sort: 'created_at' });
});

app.get('/api/harvests/:id', (req, res) => {
  const h = harvests.find((item) => item.id === req.params.id);
  if (!h) return res.status(404).json({ error: 'Harvest not found' });
  const candidates = harvestCandidates.filter((c) => c.harvestId === h.id);
  res.json({ ...h, candidates });
});

// 20. Harvest Candidates
app.get('/api/harvest-candidates', (req, res) => {
  res.json({ items: harvestCandidates, total: harvestCandidates.length, page: 1, pageSize: 100 });
});

// 27. Open Questions
app.get('/api/open-questions', (req, res) => {
  res.json({ items: openQuestions, total: openQuestions.length, page: 1, pageSize: 100 });
});

app.get('/api/open-questions/:id', (req, res) => {
  const q = openQuestions.find((item) => item.id === req.params.id);
  if (!q) return res.status(404).json({ error: 'Open Question not found' });
  res.json(q);
});

app.post('/api/open-questions', (req, res) => {
  const { title, description, category, blocking, requirementId, candidateId } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const newQ = {
    id: `q-${Date.now()}`,
    title,
    description: description || '',
    category: category || 'AMBIGUITY',
    status: 'OPEN',
    blocking: Boolean(blocking),
    createdBy: 'architect',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    requirementId: requirementId || null,
    candidateId: candidateId || null,
    entityType: 'requirement',
    entityId: requirementId || null,
    entityTitle: title,
    answers: [],
  };

  openQuestions.push(newQ);
  broadcastEvent('QUESTION_CREATED', newQ);
  res.status(201).json({ id: newQ.id });
});

app.post('/api/open-questions/:id/answers', (req, res) => {
  const q = openQuestions.find((item) => item.id === req.params.id);
  if (!q) return res.status(404).json({ error: 'Question not found' });

  const { answer, role, confidence, reasoning } = req.body;
  if (!answer || !role) return res.status(400).json({ error: 'answer and role required' });

  const newAns = {
    id: `ans-${Date.now()}`,
    questionId: q.id,
    role,
    answer,
    confidence: confidence || 'HIGH',
    reasoning: reasoning || null,
    answeredAt: new Date().toISOString(),
  };

  if (!q.answers) q.answers = [];
  q.answers.push(newAns);
  q.updatedAt = new Date().toISOString();

  broadcastEvent('QUESTION_ANSWERED', { questionId: q.id, answer: newAns });
  res.status(201).json(newAns);
});

app.put('/api/open-questions/:id/resolve', (req, res) => {
  const q = openQuestions.find((item) => item.id === req.params.id);
  if (!q) return res.status(404).json({ error: 'Question not found' });

  q.status = 'RESOLVED';
  q.resolvedAt = new Date().toISOString();
  q.updatedAt = new Date().toISOString();

  broadcastEvent('QUESTION_RESOLVED', q);
  res.json({ ok: true, question: q });
});

// 39. Execution Requests
app.get('/api/execution/requests', (req, res) => {
  res.json({ items: executionRequests, total: executionRequests.length, page: 1, pageSize: 100 });
});

app.post('/api/execution/requests', (req, res) => {
  const { businessKey, title, intentType, objective, inputs } = req.body;
  if (!businessKey) return res.status(400).json({ error: 'businessKey is required' });

  const newExec = {
    id: `exec-${Date.now()}`,
    businessKey,
    title: title || businessKey,
    intentType: intentType || 'task',
    objective: objective || '',
    inputs: inputs || {},
    deterministic: true,
    maxRetries: 3,
    timeoutPolicy: '300s',
    resourceHints: [],
    opTrace: {},
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  executionRequests.push(newExec);
  broadcastEvent('EXECUTION_CREATED', newExec);
  res.status(201).json(newExec);
});

app.get('/api/execution/receipts', (req, res) => {
  res.json({ items: executionReceipts, total: executionReceipts.length, page: 1, pageSize: 100 });
});

app.get('/api/execution/state', (req, res) => {
  res.json({
    requests: { RUNNING: 1, SUCCEEDED: 1, DRAFT: 0 },
    leases: { ACTIVE: 1, RELEASED: 0 },
    attempts: { RUNNING: 1, SUCCEEDED: 1, FAILED: 0 },
    receipts: { EXECUTION_COMPLETE: executionReceipts.length },
    totalRequests: executionRequests.length,
    activeLeases: 1,
  });
});

// 33. Agent Records
app.get('/api/agent-records', (req, res) => {
  res.json({ items: agentRecords, total: agentRecords.length, page: 1, pageSize: 100 });
});

app.get('/api/agent-records/:id', (req, res) => {
  const r = agentRecords.find((item) => item.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Agent record not found' });
  res.json(r);
});

// 34. OP Registry
app.get('/api/op-registry', (req, res) => {
  res.json({ items: opRegistry, total: opRegistry.length, page: 1, pageSize: 100 });
});

app.post('/api/op-registry', (req, res) => {
  const opSeq = Array.isArray(req.body.opSequence)
    ? req.body.opSequence
    : typeof req.body.opSequence === 'string'
    ? req.body.opSequence.split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];
  const newEntry = {
    id: `op-${Date.now()}`,
    intentId: req.body.intentId || 'CUSTOM_INTENT',
    version: req.body.version || 1,
    label: req.body.label || req.body.intentId || 'Custom Opcode Sequence',
    description: req.body.description || '',
    notes: req.body.notes || null,
    opSequence: opSeq,
    status: req.body.status || 'active',
    metadata: req.body.metadata || {},
    deletedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  opRegistry.unshift(newEntry);
  res.status(201).json(newEntry);
});

app.post(['/api/op-registry/fork', '/api/op-registry/:id/fork'], (req, res) => {
  const targetId = req.params.id || req.body.id || req.body.opRegistryId;
  const target = opRegistry.find((o) => o.id === targetId) || opRegistry[0];

  if (!target) {
    return res.status(404).json({ error: 'Op Registry entry not found to fork' });
  }

  const forkedEntry = {
    ...target,
    id: `op-${Date.now()}`,
    version: (target.version || 1) + 1,
    label: `${target.label || target.intentId} (v${(target.version || 1) + 1})`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  opRegistry.unshift(forkedEntry);
  res.status(201).json(forkedEntry);
});

// 15. Plans
app.get('/api/plans', (req, res) => {
  res.json({ items: plans, total: plans.length, page: 1, pageSize: 100 });
});

// 35. Knowledge Entities
app.get('/api/knowledge/entities', (req, res) => {
  res.json({ items: knowledgeEntities, total: knowledgeEntities.length, page: 1, pageSize: 100 });
});

// 26. Roles
app.get('/api/roles', (req, res) => {
  res.json({ items: roles, total: roles.length, page: 1, pageSize: 100 });
});

// 18. User Preferences
app.get('/api/preferences', (req, res) => {
  res.json(userPreferences);
});

app.put('/api/preferences/:key', (req, res) => {
  userPreferences[req.params.key] = req.body.value;
  broadcastEvent('PREFERENCES_UPDATED', { key: req.params.key, value: req.body.value });
  res.json({ ok: true });
});

// 28. Search Across 13 Tables
app.get('/api/search', (req, res) => {
  const query = ((req.query.q as string) || '').toLowerCase().trim();
  if (!query || query.length < 2) {
    return res.json({ query, results: [], total: 0 });
  }

  const results: any[] = [];

  // Requirements
  requirements.forEach((r) => {
    if (r.title.toLowerCase().includes(query) || r.description.toLowerCase().includes(query)) {
      results.push({
        type: 'requirement',
        id: r.id,
        title: r.title,
        description: r.description.slice(0, 150),
        status: r.status,
        href: `/requirements?id=${r.id}`,
      });
    }
  });

  // Systems
  systems.forEach((s) => {
    if (s.name.toLowerCase().includes(query) || s.description.toLowerCase().includes(query)) {
      results.push({
        type: 'system',
        id: s.id,
        title: s.name,
        description: s.description.slice(0, 150),
        status: 'Active',
        href: `/systems?id=${s.id}`,
      });
    }
  });

  // Open Questions
  openQuestions.forEach((q) => {
    if (q.title.toLowerCase().includes(query) || (q.description && q.description.toLowerCase().includes(query))) {
      results.push({
        type: 'open_question',
        id: q.id,
        title: q.title,
        description: (q.description || '').slice(0, 150),
        status: q.status,
        href: `/questions?id=${q.id}`,
      });
    }
  });

  // Agent Records
  agentRecords.forEach((a) => {
    if (a.title.toLowerCase().includes(query) || (a.content && a.content.toLowerCase().includes(query))) {
      results.push({
        type: 'agent_record',
        id: a.id,
        title: a.title,
        description: (a.content || '').slice(0, 150),
        status: a.role,
        href: `/audit?id=${a.id}`,
      });
    }
  });

  res.json({
    query,
    results: results.slice(0, 50),
    total: results.length,
  });
});

// 45. CPF - Compilation Readiness Framework (CPF Funnel query API)
const handleCpfQuery = (req: express.Request, res: express.Response) => {
  const isCountOnly = req.query.count === 'true';
  const isAll = req.query.all === 'true';
  const candidateId = (req.query.candidate || req.query.id) as string;
  const thresholdParam = req.query.threshold ? parseFloat(req.query.threshold as string) : 0.7;
  const statusFilter = (req.query.status as string) || 'all';
  const systemFilter = (req.query.system_name || req.query.system) as string;
  const searchQuery = ((req.query.q || req.query.search) as string || '').toLowerCase().trim();

  // Calculate funnel bracket statistics across all ~1013 candidates
  const total = harvestCandidates.length;
  const brackets = {
    '0.90-1.00': harvestCandidates.filter((c) => c.compilation_readiness >= 0.90).length,
    '0.80-0.89': harvestCandidates.filter((c) => c.compilation_readiness >= 0.80 && c.compilation_readiness < 0.90).length,
    '0.70-0.79': harvestCandidates.filter((c) => c.compilation_readiness >= 0.70 && c.compilation_readiness < 0.80).length,
    '0.60-0.69': harvestCandidates.filter((c) => c.compilation_readiness >= 0.60 && c.compilation_readiness < 0.70).length,
    '0.50-0.59': harvestCandidates.filter((c) => c.compilation_readiness >= 0.50 && c.compilation_readiness < 0.60).length,
    '0.00-0.49': harvestCandidates.filter((c) => c.compilation_readiness < 0.50).length,
  };

  const ready = harvestCandidates.filter((c) => c.compilation_readiness >= 0.70).length;
  const promoted = harvestCandidates.filter((c) => c.status === 'promoted').length;
  const nearMiss = harvestCandidates.filter((c) => c.compilation_readiness >= 0.50 && c.compilation_readiness < 0.70).length;
  const low = harvestCandidates.filter((c) => c.compilation_readiness < 0.50).length;

  if (isCountOnly) {
    return res.json({
      count: ready,
      ready,
      promoted,
      nearMiss,
      low,
      total,
      brackets,
      threshold: thresholdParam,
    });
  }

  // Single candidate detail
  if (candidateId) {
    const cand = harvestCandidates.find((c) => c.id === candidateId);
    if (!cand) return res.status(404).json({ error: 'Candidate not found' });
    return res.json(cand);
  }

  // Filter items
  let filtered = [...harvestCandidates];

  if (!isAll) {
    filtered = filtered.filter((c) => c.compilation_readiness >= thresholdParam);
  }

  if (statusFilter !== 'all') {
    filtered = filtered.filter((c) => c.status === statusFilter);
  }

  if (systemFilter) {
    filtered = filtered.filter((c) => c.system_name === systemFilter || c.systemId === systemFilter);
  }

  if (searchQuery) {
    filtered = filtered.filter(
      (c) =>
        c.title.toLowerCase().includes(searchQuery) ||
        (c.intent_description && c.intent_description.toLowerCase().includes(searchQuery)) ||
        c.tags.some((t: string) => t.toLowerCase().includes(searchQuery)) ||
        (c.system_name && c.system_name.toLowerCase().includes(searchQuery))
    );
  }

  // Sort descending by compilation_readiness
  filtered.sort((a, b) => b.compilation_readiness - a.compilation_readiness);

  // Return standard array or items wrapper depending on client query
  if (req.query.json === 'true' || req.path.endsWith('/query')) {
    return res.json(filtered);
  }

  return res.json({
    items: filtered,
    total: filtered.length,
    dbTotal: total,
    readyCount: ready,
    promotedCount: promoted,
    nearMissCount: nearMiss,
    lowCount: low,
    brackets,
    threshold: thresholdParam,
  });
};

app.get('/api/cpf', handleCpfQuery);
app.get('/api/cpf/query', handleCpfQuery);

app.get('/api/cpf/count', (req, res) => {
  const ready = harvestCandidates.filter((c) => c.compilation_readiness >= 0.70).length;
  const promoted = harvestCandidates.filter((c) => c.status === 'promoted').length;
  const nearMiss = harvestCandidates.filter((c) => c.compilation_readiness >= 0.50 && c.compilation_readiness < 0.70).length;
  const low = harvestCandidates.filter((c) => c.compilation_readiness < 0.50).length;
  const total = harvestCandidates.length;

  res.json({
    count: ready,
    ready,
    promoted,
    nearMiss,
    low,
    total,
    brackets: {
      '0.90-1.00': harvestCandidates.filter((c) => c.compilation_readiness >= 0.90).length,
      '0.80-0.89': harvestCandidates.filter((c) => c.compilation_readiness >= 0.80 && c.compilation_readiness < 0.90).length,
      '0.70-0.79': harvestCandidates.filter((c) => c.compilation_readiness >= 0.70 && c.compilation_readiness < 0.80).length,
      '0.60-0.69': harvestCandidates.filter((c) => c.compilation_readiness >= 0.60 && c.compilation_readiness < 0.70).length,
      '0.50-0.59': harvestCandidates.filter((c) => c.compilation_readiness >= 0.50 && c.compilation_readiness < 0.60).length,
      '0.00-0.49': harvestCandidates.filter((c) => c.compilation_readiness < 0.50).length,
    },
  });
});

app.post('/api/cpf/promote', (req, res) => {
  const candidateId = req.body.candidateId || req.body.candidate;
  if (!candidateId) return res.status(400).json({ error: 'candidateId is required' });

  const cand = harvestCandidates.find((c) => c.id === candidateId);
  if (!cand) return res.status(404).json({ error: 'Candidate not found' });

  cand.status = 'promoted';
  cand.completed = true;
  cand.updatedAt = new Date().toISOString();

  // Check if system exists or find core
  let targetSys = systems.find((s) => s.name === cand.system_name || s.id === cand.systemId) || systems[0];

  // Auto-generate requirement entry in nebula.requirements
  const newReqId = `req-cpf-${Date.now().toString().slice(-4)}`;
  const planNumber = `PLN-${Math.floor(100 + Math.random() * 900)}`;

  const createdReq = {
    id: newReqId,
    systemId: targetSys.id,
    subsystemId: targetSys.subsystems?.[0]?.id || null,
    featureId: null,
    title: cand.title,
    description: cand.intent_description || `Promoted from harvest candidate ${cand.id}`,
    status: 'ToDo',
    priority: cand.compilation_readiness >= 0.9 ? 'High' : 'Medium',
    startDate: new Date().toISOString().split('T')[0],
    completionDate: null,
    parentId: null,
    reqType: 'Task',
    acceptanceCriteria: [`CPF score verified at ${cand.compilation_readiness}`],
    candidateId: cand.id,
    conduitPlanId: planNumber,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  requirements.push(createdReq);

  // Auto-generate conduit plan entry
  const newPlan = {
    id: planNumber,
    title: `Conduit Plan: ${cand.title}`,
    goal: cand.intent_description || `Implementation conduit plan generated from candidate ${cand.id}`,
    content: `## Implementation Conduit Plan (${planNumber})\n\n**Candidate ID**: \`${cand.id}\`\n**CPF Readiness Score**: ${cand.compilation_readiness}\n**System**: ${cand.system_name || 'System'}\n**Subsystem**: ${cand.subsystem_name || 'Compiler Pipeline'}\n\n### Opcode Compilation Steps:\n1. Verify dependencies and intent parameters\n2. Compile Stage 1 normalized specification\n3. Match against active Opcode Registry entries\n4. Issue execution request lease`,
    files_affected: [`src/compiler/${cand.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.ts`],
    acceptance_criteria: [`Passes automated syntax check`, `Registers in op_registry`],
    dependencies: [],
    status: 'in_progress',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  plans.push(newPlan);

  cand.requirement_id = newReqId;
  cand.conduit_plan_id = planNumber;

  // Add agent record log
  agentRecords.unshift({
    id: `rec-cpf-${Date.now()}`,
    recordType: 'decision',
    role: 'planner',
    title: `CPF Candidate Promoted: ${cand.title}`,
    content: `Candidate ${cand.id} (CPF score ${cand.compilation_readiness}) promoted to requirement ${newReqId} and conduit plan ${planNumber}.`,
    sourcePath: cand.harvest_source_filename || null,
    tags: ['cpf', 'promotion', 'conduit_plan'],
    systemId: targetSys.id,
    subsystemId: null,
    featureId: null,
    planRef: planNumber,
    level: 1,
    visibilityScope: 'builder',
    createdAt: new Date().toISOString(),
  });

  broadcastEvent('CANDIDATE_PROMOTED', { candidate: cand, requirement: createdReq, plan: newPlan });
  res.json({ ok: true, promoted: true, candidate: cand, requirement: createdReq, plan: newPlan });
});

// ---------------------------------------------------------------------------
// Additional API-Spec Compliant Endpoints (Audit, Projections, Inbox, Control)
// ---------------------------------------------------------------------------

let auditFiles: any[] = [
  {
    id: 'aud-001',
    filePath: 'IMPLEMENTATION_PLANS/SYSTEM_ARCHITECTURE.md',
    content: '# Nebula System Architecture Audit\n\n- **Service Name**: nebula-srv\n- **Database Schema**: `nebula`\n- **Event Bus**: ui-event-bus on port 3200\n- **Status**: Verified Operational\n',
    sizeBytes: 184,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'aud-002',
    filePath: 'IMPLEMENTATION_PLANS/CPF_COMPILATION_PIPELINE.md',
    content: '# Compilation Readiness Framework Audit\n\n- **Promotable Threshold**: >= 0.7\n- **Status**: 10 Candidates Evaluated\n',
    sizeBytes: 120,
    updatedAt: Date.now() - 43200000,
  },
];

app.get('/api/audit', (req, res) => {
  const items = auditFiles.map(({ content, ...meta }) => ({ ...meta, content: '' }));
  res.json({ items, total: items.length, page: 1, pageSize: 100 });
});

app.get('/api/audit/graph', (req, res) => {
  const entities = agentRecords.map((r) => ({ id: r.id, label: r.title, type: r.recordType, role: r.role }));
  const edges = crossReferences.map((x) => ({ source: x.sourceId, target: x.targetId, relType: x.relType }));
  res.json({ entities, edges, entityCount: entities.length, edgeCount: edges.length });
});

app.get('/api/audit/:id', (req, res) => {
  const found = auditFiles.find((a) => a.id === req.params.id || a.filePath.includes(req.params.id));
  if (!found) return res.status(404).json({ error: 'Audit file not found' });
  res.json(found);
});

app.post('/api/audit/sync', (req, res) => {
  res.json({ ok: true, synced: auditFiles.length, files: auditFiles.map((f) => ({ ...f, content: '' })) });
});

app.post('/api/audit/:id/regenerate', (req, res) => {
  const found = auditFiles.find((a) => a.id === req.params.id);
  if (found) {
    found.updatedAt = Date.now();
  }
  res.json({ ok: true, message: 'Audit file regenerated from disk', file: found || auditFiles[0] });
});

let projections: any[] = [
  {
    id: 'proj-01',
    name: 'Architecture Blueprint Markdown',
    type: 'deterministic',
    description: 'Generates system architecture overview markdown from postgres schema metadata.',
    targetPath: 'docs/ARCHITECTURE_BLUEPRINT.md',
    model: null,
    schedule: '0 * * * *',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'proj-02',
    name: 'Agent Audit Summary',
    type: 'inference',
    description: 'Uses LLM summarization on agent_records to render executive audit summary.',
    targetPath: 'docs/AUDIT_SUMMARY.md',
    model: 'gemini-1.5-pro',
    schedule: '0 0 * * *',
    createdAt: new Date().toISOString(),
  },
];

app.get('/api/projections', (req, res) => {
  res.json({ items: projections, total: projections.length, page: 1, pageSize: 100 });
});

app.post('/api/projections', (req, res) => {
  const newProj = {
    id: `proj-${Date.now()}`,
    name: req.body.name || 'New Projection',
    type: req.body.type || 'deterministic',
    description: req.body.description || null,
    targetPath: req.body.targetPath || 'docs/PROJECTION.md',
    model: req.body.model || null,
    schedule: req.body.schedule || null,
    createdAt: new Date().toISOString(),
  };
  projections.push(newProj);
  res.status(201).json(newProj);
});

app.post('/api/projections/:id/render', (req, res) => {
  const found = projections.find((p) => p.id === req.params.id);
  res.json({ ok: true, message: `Rendered projection ${found?.name || req.params.id} to ${found?.targetPath || 'disk'}`, renderedAt: new Date().toISOString() });
});

app.delete('/api/projections/:id', (req, res) => {
  projections = projections.filter((p) => p.id !== req.params.id);
  res.json({ ok: true });
});

let inboxPointersStore: Record<string, string> = {
  architect: new Date(Date.now() - 3600000).toISOString(),
  engineer: new Date(Date.now() - 1800000).toISOString(),
  planner: new Date(Date.now() - 7200000).toISOString(),
  reviewer: new Date(Date.now() - 86400000).toISOString(),
  inspector: new Date(Date.now() - 43200000).toISOString(),
};

app.get('/api/inbox-pointer/:role', (req, res) => {
  const role = req.params.role;
  res.json({ role, timestamp: inboxPointersStore[role] || null });
});

app.put('/api/inbox-pointer/:role', (req, res) => {
  const role = req.params.role;
  const ts = req.body.timestamp || new Date().toISOString();
  inboxPointersStore[role] = ts;
  res.json({ ok: true, role, timestamp: ts });
});

app.get('/api/inbox-pointers', (req, res) => {
  res.json(inboxPointersStore);
});

let systemInfoTabsStore: Record<string, Record<string, string>> = {};

app.get('/api/systems/:id/info', (req, res) => {
  const tabs = systemInfoTabsStore[req.params.id] || {};
  const items = Object.entries(tabs).map(([tabId, content]) => ({ tabId, content, updatedAt: new Date().toISOString() }));
  res.json({ items, total: items.length, page: 1, pageSize: 100 });
});

app.put('/api/systems/:id/info/:tabId', (req, res) => {
  const sysId = req.params.id;
  const tabId = req.params.tabId;
  if (!systemInfoTabsStore[sysId]) systemInfoTabsStore[sysId] = {};
  systemInfoTabsStore[sysId][tabId] = req.body.content || '';
  res.json({ ok: true, systemId: sysId, tabId, content: systemInfoTabsStore[sysId][tabId] });
});

app.delete('/api/systems/:id/info/:tabId', (req, res) => {
  const sysId = req.params.id;
  const tabId = req.params.tabId;
  if (systemInfoTabsStore[sysId]) {
    delete systemInfoTabsStore[sysId][tabId];
  }
  res.json({ ok: true });
});

app.get('/api/cross-references', (req, res) => {
  res.json({ items: crossReferences, total: crossReferences.length, page: 1, pageSize: 100 });
});

app.get('/api/cross-references/:id', (req, res) => {
  const item = crossReferences.find((x) => x.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Cross reference not found' });
  res.json(item);
});

let evidenceLinks: any[] = [
  {
    id: 'ev-001',
    knowledgeEntityId: 'ke-001',
    nebulaHarvestId: 'harv-101',
    nebulaCandidateId: 'cand-001',
    linkType: 'supports',
    provenance: 'harv-101:transcript',
    confidence: 0.92,
    metadata: {},
    createdAt: Date.now() - 86400000,
  },
];

app.get('/api/evidence-links', (req, res) => {
  res.json({ items: evidenceLinks, total: evidenceLinks.length, page: 1, pageSize: 100 });
});

app.get('/api/evidence-links/:id', (req, res) => {
  const item = evidenceLinks.find((e) => e.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Evidence link not found' });
  res.json(item);
});

app.get('/api/knowledge/summary', (req, res) => {
  res.json({
    entityCount: knowledgeEntities.length,
    edgeCount: 25,
    crossReferenceCount: crossReferences.length,
    bySection: [
      { section: 'requirement', count: requirements.length },
      { section: 'api', count: 12 },
      { section: 'schema', count: 8 },
    ],
    byRelationType: [
      { relation_type: 'depends_on', count: 15 },
      { relation_type: 'compiles_to', count: 10 },
    ],
    embeddingSummary: [
      { section: 'api', entity_count: 12, embedded_count: 12 },
      { section: 'requirement', entity_count: requirements.length, embedded_count: requirements.length },
    ],
  });
});

app.get('/api/knowledge/edges', (req, res) => {
  const items = crossReferences.map((x) => ({
    id: x.id,
    sourceSection: x.sourceType,
    sourceId: x.sourceId,
    targetSection: x.targetType,
    targetId: x.targetId,
    relationType: x.relType,
    weight: 1.0,
    createdAt: x.createdAt,
  }));
  res.json({ items, total: items.length, page: 1, pageSize: 100 });
});

app.post('/api/refresh-stats', (req, res) => {
  res.json({ ok: true, refreshed: 5, views: ['v_graph_summary', 'v_requirement_stats', 'v_candidate_metrics'] });
});

app.post('/api/seed', (req, res) => {
  res.json({ ok: true, seeded: { systems: systems.length, requirements: requirements.length, harvests: harvests.length } });
});

app.post('/api/import', (req, res) => {
  res.json({ ok: true, imported: { records: 10 } });
});

app.post('/api/harvest-candidates/:id/spawn-plan', (req, res) => {
  const cand = harvestCandidates.find((c) => c.id === req.params.id);
  const planNumber = `PLN-${Math.floor(200 + Math.random() * 800)}`;
  const xrefId = `xref-${Date.now()}`;
  if (cand) {
    cand.status = 'promoted';
    cand.conduit_plan_id = planNumber;
  }
  res.json({ ok: true, planNumber, xrefId });
});

app.post('/api/harvest-candidates/discover', (req, res) => {
  res.json({ ok: true, discovered: 2, totalCandidates: harvestCandidates.length + 2 });
});

app.post('/api/harvest-candidates/promote-to-plan', (req, res) => {
  const planNumber = `PLN-${Math.floor(300 + Math.random() * 700)}`;
  res.json({ ok: true, planNumber, message: 'Candidates collated into conduit plan' });
});

let executionLeases: any[] = [];

app.post('/api/execution/leases/acquire', (req, res) => {
  const lease = {
    id: `lease-${Date.now()}`,
    requestId: req.body.requestId || 'req-101',
    owner: req.body.owner || 'worker-01',
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + (req.body.ttlSeconds || 300) * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };
  executionLeases.push(lease);
  res.json(lease);
});

app.post('/api/execution/leases/:id/renew', (req, res) => {
  const lease = executionLeases.find((l) => l.id === req.params.id);
  if (lease) {
    lease.expiresAt = new Date(Date.now() + (req.body.ttlSeconds || 300) * 1000).toISOString();
  }
  res.json(lease || { id: req.params.id, status: 'ACTIVE', expiresAt: new Date(Date.now() + 300000).toISOString() });
});

app.post('/api/execution/leases/:id/release', (req, res) => {
  const lease = executionLeases.find((l) => l.id === req.params.id);
  if (lease) {
    lease.status = 'RELEASED';
  }
  res.json({ ok: true, status: 'RELEASED' });
});

app.post('/api/execution/attempts', (req, res) => {
  const attempt = {
    id: `att-${Date.now()}`,
    requestId: req.body.requestId,
    leaseId: req.body.leaseId,
    executorId: req.body.executorId || 'executor-01',
    status: req.body.status || 'RUNNING',
    createdAt: new Date().toISOString(),
  };
  res.status(201).json(attempt);
});

app.post('/api/agent-records/search', (req, res) => {
  const q = (req.body.query || '').toLowerCase();
  const items = agentRecords.filter((r) => {
    if (q && !r.title.toLowerCase().includes(q) && !r.content.toLowerCase().includes(q)) return false;
    if (req.body.type && r.recordType !== req.body.type) return false;
    if (req.body.role && r.role !== req.body.role) return false;
    return true;
  });
  res.json({ items, total: items.length, limit: req.body.limit || 50, offset: req.body.offset || 0 });
});

// 27. Semantic Vector Search Simulation
app.post('/api/search/semantic', (req, res) => {
  const results = knowledgeEntities.map((ent) => ({
    section: ent.section,
    entityId: ent.entityId,
    name: ent.name,
    description: ent.descriptionAbbr,
    similarity: 0.85 + Math.random() * 0.12,
  }));
  res.json({ query: { limit: 10 }, results, total: results.length });
});

// ---------------------------------------------------------------------------
// Vite Middleware & Static Server Mounting
// ---------------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Nebula-srv IDE Backend] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[Nebula-srv WebSocket] Real-time engine attached on ws://0.0.0.0:${PORT}/ws`);
  });
}

startServer();

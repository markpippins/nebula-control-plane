/**
 * Nebula Process Control & IDE API Data Types
 * Matches the complete nebula-srv REST API specification
 */

export type RequirementStatus =
  | 'Backlog'
  | 'ToDo'
  | 'InProgress'
  | 'Active'
  | 'Blocked'
  | 'Done'
  | 'Cancelled'
  | 'Accepted';

export type RequirementType = 'Epic' | 'Story' | 'Task' | 'Bug';
export type RequirementPriority = 'High' | 'Medium' | 'Low' | 'Critical';

export interface Folder {
  id: string;
  name: string;
  category: string;
  note?: string;
}

export interface Feature {
  id: string;
  subsystemId: string;
  name: string;
  description: string;
  readme?: string | null;
  createdAt: number;
}

export interface Subsystem {
  id: string;
  systemId: string;
  name: string;
  description: string;
  readme?: string | null;
  color: string;
  createdAt: number;
  features: Feature[];
}

export interface SystemItem {
  id: string;
  name: string;
  description: string;
  readme?: string | null;
  architecture?: string | null;
  createdAt: number;
  folders: Folder[];
  subsystems: Subsystem[];
}

export interface Requirement {
  id: string;
  systemId: string;
  subsystemId?: string | null;
  featureId?: string | null;
  title: string;
  description: string;
  status: RequirementStatus;
  priority: RequirementPriority;
  startDate?: string | null;
  completionDate?: string | null;
  parentId?: string | null;
  reqType?: RequirementType | null;
  acceptanceCriteria?: string[] | Record<string, unknown> | null;
  candidateId?: string | null;
  conduitPlanId?: string | null;
  createdAt?: number;
  updatedAt?: number;
}

export interface RequirementDependency {
  id: string;
  relType: 'req:blocks' | 'req:depends_on';
  sourceType: 'requirement';
  sourceId: string;
  targetType: 'requirement';
  targetId: string;
  direction?: 'outgoing' | 'incoming';
  otherId?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface CompilationIR {
  ok: boolean;
  stage: number;
  stage1: {
    title: string;
    description: string;
    systemName?: string;
    subsystemName?: string;
    featureName?: string;
    acceptanceCriteriaNormalized: string[];
    synthesizedIntent: string;
  };
  stage2: {
    requirement_id: string;
    intent_id: string;
    registry_version: string;
    op_sequence: string[];
    files_affected: string[];
    dependencies: string[];
    acceptance_criteria: string[];
    idempotency_key: string;
    matched_op_registry_id?: string | null;
  };
  journal_entry_id?: string;
  plan_number?: string | null;
}

export interface CpfScoringBreakdown {
  intent_filled: number;
  hierarchy_mapped: number;
  tagged: number;
  has_artifacts: number;
  deps_resolved: number;
  reconciled: number;
}

export interface CpfCandidate {
  id: string;
  title: string;
  intent_description: string;
  intentDescription?: string;
  status: 'pending' | 'promoted' | 'linked' | 'useful' | 'rejected' | string;
  compilation_readiness: number;
  compilationReadiness?: number;
  completed: boolean;
  tags: string[];
  system_name?: string | null;
  subsystem_name?: string | null;
  feature_name?: string | null;
  systemId?: string | null;
  subsystemId?: string | null;
  featureId?: string | null;
  dep_count: number;
  promotable: boolean;
  harvest_id?: string;
  harvest_source_filename?: string;
  harvestSourceFilename?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  scoring_breakdown?: CpfScoringBreakdown;
  conduit_plan_id?: string | null;
  conduitPlanId?: string | null;
  requirement_id?: string | null;
  requirementId?: string | null;
}

export interface CpfStats {
  count?: number;
  ready: number;
  promoted: number;
  nearMiss: number;
  low: number;
  total?: number;
  threshold?: number;
  brackets?: {
    '0.90-1.00': number;
    '0.80-0.89': number;
    '0.70-0.79': number;
    '0.60-0.69': number;
    '0.50-0.59': number;
    '0.00-0.49': number;
  };
}

export interface HarvestCandidate {
  id: string;
  harvestId: string;
  title: string;
  intentDescription?: string | null;
  implementationNotes?: Record<string, unknown>;
  codeSnippets?: Record<string, unknown>;
  openQuestions?: Record<string, unknown>;
  tags: string[];
  status?: string | null;
  systemId?: string | null;
  subsystemId?: string | null;
  featureId?: string | null;
  workRequestId?: string | null;
  completed: boolean;
  compilationReadiness: number;
  createdAt: string;
  updatedAt: string;
  harvestSourceFilename?: string | null;
}

export interface Harvest {
  id: string;
  sourcePath: string;
  sourceFilename: string;
  model: string;
  totalCandidates: number;
  candidates?: HarvestCandidate[];
  sourceText?: string;
  tags: string[];
  metadata?: Record<string, unknown>;
  level: number;
  visibilityScope: string;
  docklang?: Record<string, unknown>;
  sourceHash?: string;
  fileSize?: number;
  version?: number;
  runMetadata?: Record<string, unknown>;
  createdAt: string;
  codeBlocks?: number;
  turns?: number;
  blocksPerTurn?: number;
  userTurns?: number;
  keywordHits?: number;
  tagFrequency?: number;
}

export interface OpenQuestionAnswer {
  id: string;
  questionId: string;
  role: string;
  answer: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning?: string | null;
  answeredAt: string;
}

export interface OpenQuestion {
  id: string;
  title: string;
  description?: string | null;
  category: 'AMBIGUITY' | 'MISSING_INFO' | 'CONFLICT' | 'SCOPE' | 'DEPENDENCY' | 'DUPLICATE_CANDIDATE' | 'WORK_COMPLETED';
  status: 'OPEN' | 'RESOLVED';
  blocking: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  requirementId?: string | null;
  candidateId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  entityTitle?: string | null;
  answers?: OpenQuestionAnswer[];
}

export interface DeliberationParticipant {
  id: string;
  openQuestionId: string;
  role: string;
  participatedAt: string;
  contribution?: string | null;
}

export interface TimelineEvent {
  type: string;
  label: string;
  description: string;
  timestamp: string;
  actor: string;
  icon?: string;
}

export interface ExecutionRequest {
  id: string;
  businessKey: string;
  title: string;
  intentType: string;
  objective?: string | null;
  inputs?: Record<string, unknown>;
  deterministic: boolean;
  maxRetries?: number | null;
  timeoutPolicy?: string | null;
  resourceHints?: string[];
  opTrace?: Record<string, unknown>;
  status: 'DRAFT' | 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'ADMITTED' | 'READY';
  sourcePlanId?: string | null;
  sourceWrId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionReceipt {
  id: string;
  attemptId: string;
  requestId: string;
  type: 'EXECUTION_COMPLETE' | 'EXECUTION_FAILED' | 'EXECUTION_STARTED';
  agentRole: string;
  summary: string;
  metadata?: Record<string, unknown>;
  issuedAt: string;
}

export interface ExecutionStateSummary {
  requests: Record<string, number>;
  leases?: Record<string, number>;
  attempts?: Record<string, number>;
  receipts?: Record<string, number>;
  totalRequests: number;
  activeLeases: number;
}

export interface AgentRecord {
  id: string;
  recordType: 'report' | 'analysis' | 'assessment' | 'decision' | 'engineering_log';
  role: 'architect' | 'engineer' | 'planner' | 'reviewer' | 'inspector' | 'analyst';
  title: string;
  content?: string;
  sourcePath?: string | null;
  tags: string[];
  systemId?: string | null;
  subsystemId?: string | null;
  featureId?: string | null;
  planRef?: string | null;
  level: number;
  visibilityScope: string;
  createdAt: string;
}

export interface OpRegistryEntry {
  id: string;
  intentId: string;
  version: number;
  label: string;
  description: string;
  notes?: string | null;
  opSequence: string[];
  status: 'active' | 'deprecated' | 'superseded';
  metadata?: Record<string, unknown>;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImplementationPlan {
  id: string;
  title: string;
  goal: string;
  content: string;
  files_affected: string[];
  acceptance_criteria: string[];
  dependencies: string[];
  status: 'accepted' | 'archived' | 'backlog' | 'done' | 'in_progress' | 'pending';
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  sizeBytes?: number;
  modifiedAt?: string;
}

export interface KnowledgeEntity {
  id: string;
  section: string;
  entityId: string;
  name: string;
  entityType: string;
  status: string;
  descriptionAbbr: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeEdge {
  id: string;
  sourceSection: string;
  sourceId: string;
  sourceName?: string;
  targetSection: string;
  targetId: string;
  targetName?: string;
  relationType: string;
  weight: number;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface CrossReference {
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relType: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface RoleDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  ownsDomains: string[];
  canGreenlight: boolean;
  canCreateQuestions: boolean;
  canCreateAgendas: boolean;
  canResolveQuestions: boolean;
  canVerifyWorkRequests: boolean;
  maxOpenQuestions?: number | null;
  requiresApprovalFrom: string[];
  cronEnabled: boolean;
  cronExpression?: string | null;
  cronDescription?: string | null;
  escalatesTo: string[];
  escalationTriggers: string[];
  levelFilterPrimary: string;
  levelFilterAllowed: string;
  visibilityScope: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CountsSummary {
  threads: number;
  requirements: number;
  agendas: number;
  candidates: number;
  harvests: number;
  openQuestions: number;
  intents: number;
  assessments: number;
  observations: number;
  agentRecords: number;
  specifications: number;
  plans: number;
  users: number;
}

export interface SearchResultItem {
  type:
    | 'thread'
    | 'requirement'
    | 'agenda'
    | 'candidate'
    | 'harvest'
    | 'open_question'
    | 'intent'
    | 'assessment'
    | 'observation'
    | 'agent_record'
    | 'specification'
    | 'plan'
    | 'user';
  id: string;
  title: string;
  description: string;
  status?: string | null;
  href: string;
}

export interface PaginatedEnvelope<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  sort?: string;
}

export interface WebSocketEvent {
  type: string;
  payload: unknown;
  timestamp: string;
  sourceClientId?: string;
}

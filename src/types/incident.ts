export type Severity = "Sev-1" | "Sev-2" | "Sev-3";
export type IncidentCategory = "security" | "infra" | "data-breach" | "cascade" | "cloud" | "api-failure";
export type NodeStatus = "healthy" | "degraded" | "failing";
export type DecisionVerdict = "optimal" | "acceptable" | "suboptimal" | "catastrophic";
export type LogLevel = "CRIT" | "ERROR" | "WARN" | "INFO";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
}

export interface SystemMetrics {
  cpuPercent: number;
  memoryPercent: number;
  errorRatePercent: number;
  latencyP99Ms: number;
  dbConnectionsActive: number;
  dbConnectionsMax: number;
  financialLossPerMinute: number;
  reputationScore: number;
}

export interface TopologyNode {
  id: string;
  name: string;
  status: NodeStatus;
  type: "gateway" | "network" | "compute" | "auth" | "database" | "cache";
  metric: string;
}

export interface DecisionOption {
  id: string;
  title: string;
  description: string;
  risk: "Low" | "Medium" | "High";
  command?: string;
  expectedTradeoff?: string;
}

export interface IncidentPhase {
  phaseIndex: number;
  phaseName: string;
  description: string;
  options: DecisionOption[];
}

export interface TeamReaction {
  author: string;
  role: "sre" | "secops" | "devops" | "management";
  message: string;
  timestamp?: string;
}

export interface Scenario {
  id: string;
  title: string;
  category: IncidentCategory;
  severity: Severity;
  estimatedBlastRadius: string;
  summary: string;
  architectureStack: string;
  initialLogs: LogEntry[];
  initialMetrics: SystemMetrics;
  topologyNodes: TopologyNode[];
  phases: IncidentPhase[];
}

export interface EvaluationResult {
  verdict: DecisionVerdict;
  scoreDelta: number;
  analysis: string;
  immediateOutcome: string;
  updatedMetrics: Partial<SystemMetrics>;
  newLogs: Omit<LogEntry, "id">[];
  teamReactions: TeamReaction[];
  isIncidentResolved: boolean;
  nextPhase?: IncidentPhase;
}

export interface PostMortemData {
  executiveSummary: string;
  rootCauseAnalysis: {
    primaryRootCause: string;
    fiveWhys: { why: string; answer: string }[];
  };
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  gradeScore: number;
  incidentScorecard: {
    mttd: string;
    mtta: string;
    mttr: string;
    slaBreach: boolean;
    estimatedDowntimeCost: string;
    dataIntegrityStatus: string;
  };
  keyStrengths: string[];
  criticalMistakesAndAntiPatterns: string[];
  actionItems: { priority: "P0" | "P1" | "P2"; task: string; owner: string }[];
  lessonsLearned: string[];
  markdownReport: string;
}

export interface ActionHistoryItem {
  phaseIndex: number;
  phaseName: string;
  actionTaken: string;
  timestamp: string;
  verdict: DecisionVerdict;
  scoreDelta: number;
  analysis: string;
}

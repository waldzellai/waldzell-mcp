export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type AttackCategory = 'prompt-injection' | 'tool-misuse' | 'egress-escalation' | 'pii-extraction';

export interface AttackScenario {
  id: string;
  category: AttackCategory;
  name: string;
  description: string;
  input: Record<string, unknown>;
  expectedBehavior: 'block' | 'sanitize' | 'log';
  enabled: boolean;
}

export interface Finding {
  scenarioId: string;
  category: AttackCategory;
  severity: Severity;
  likelihood: number; // 0-1
  title: string;
  description: string;
  reproSteps: string[];
  evidence?: {
    input?: string;
    output?: string;
    trace?: string;
  };
  mitigation?: string;
}

export interface RedTeamReport {
  candidateId: string;
  timestamp: string;
  scenariosRun: number;
  findings: Finding[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  pass: boolean; // false if any critical or high findings
  summary: string;
}

export interface RedTeamConfig {
  scenarios?: AttackScenario[];
  customScenariosPath?: string;
  failOnSeverity?: Severity; // Auto-fail if finding at or above this severity
}

import { z } from 'zod';
import { KernelTool } from '@unternet/kernel';

export interface IntentRouterConfig {
  plannerModel: {
    model: string;
    host?: string;
    port?: number;
    cors?: OllamaCorsConfig;
  };
  executorModel: {
    endpoint: string;
    apiKey: string;
    model: string;
  };
  tools: KernelTool[];
  maxExecutionSteps?: number;
  securityPolicies?: SecurityPolicy[];
}

export interface SecurityPolicy {
  name: string;
  description: string;
  evaluate: (context: SecurityContext) => Promise<SecurityResult>;
}

export interface SecurityContext {
  toolName: string;
  args: Record<string, any>;
  dataProvenance: DataProvenance;
  userContext: UserContext;
}

export interface SecurityResult {
  allowed: boolean;
  reason?: string;
  modifications?: Record<string, any>;
}

export interface DataProvenance {
  source: 'user' | 'camel' | 'tool' | 'external';
  capabilities: DataCapabilities;
  transformations: string[];
}

export interface DataCapabilities {
  readers: string[];
  sources: string[];
  sensitive: boolean;
}

export interface UserContext {
  userId?: string;
  permissions: string[];
  trustLevel: 'low' | 'medium' | 'high';
}

export const ExecutionPlanSchema = z.object({
  intent: z.string().describe('The user\'s intent in natural language'),
  topology: z.object({
    agents: z.array(z.object({
      id: z.string(),
      type: z.string(),
      role: z.string(),
      capabilities: z.array(z.string())
    })),
    tools: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      securityLevel: z.enum(['low', 'medium', 'high'])
    })),
    dataFlow: z.array(z.object({
      from: z.string(),
      to: z.string(),
      dataType: z.string(),
      securityConstraints: z.array(z.string())
    }))
  }),
  executionSteps: z.array(z.object({
    id: z.string(),
    type: z.enum(['tool_call', 'data_transform', 'security_check']),
    toolName: z.string().optional(),
    args: z.record(z.any()).optional(),
    expectedOutput: z.string().optional(),
    securityPolicies: z.array(z.string()).optional()
  })),
  contextRequired: z.array(z.string()),
  riskAssessment: z.object({
    level: z.enum(['low', 'medium', 'high']),
    factors: z.array(z.string()),
    mitigations: z.array(z.string())
  }),
  canExecute: z.boolean().describe('Whether the plan can be safely executed')
});

export type ExecutionPlan = z.infer<typeof ExecutionPlanSchema>;

export interface ExecutionResult {
  success: boolean;
  results: any[];
  errors: string[];
  securityViolations: string[];
  executionTime: number;
}

export interface OllamaCorsConfig {
  enabled: boolean;
  origin: string | string[];
  methods: string[];
  headers: string[];
  credentials: boolean;
}

export interface IntentRouterEvents {
  'plan.generated': ExecutionPlan;
  'execution.started': ExecutionPlan;
  'execution.completed': ExecutionResult;
  'security.violation': { policy: string; reason: string };
  'error': Error;
}
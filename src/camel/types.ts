import { z } from 'zod';

export type CaMeLValueId = string;

export interface Source {
  readonly type: 'user' | 'camel' | 'tool' | 'assistant' | 'external';
  readonly metadata?: Record<string, any>;
}

export interface UserSource extends Source {
  readonly type: 'user';
  readonly userId?: string;
}

export interface CaMeLSource extends Source {
  readonly type: 'camel';
  readonly operation: string;
}

export interface ToolSource extends Source {
  readonly type: 'tool';
  readonly toolName: string;
  readonly innerSources: readonly Source[];
}

export interface AssistantSource extends Source {
  readonly type: 'assistant';
  readonly modelId: string;
}

export interface ExternalSource extends Source {
  readonly type: 'external';
  readonly origin: string;
}

export type CaMeLSources = UserSource | CaMeLSource | ToolSource | AssistantSource | ExternalSource;

export interface Readers {
  readonly type: 'public' | 'restricted';
  readonly allowedReaders?: readonly string[];
}

export interface PublicReaders extends Readers {
  readonly type: 'public';
}

export interface RestrictedReaders extends Readers {
  readonly type: 'restricted';
  readonly allowedReaders: readonly string[];
}

export interface Capabilities {
  readonly sources: readonly CaMeLSources[];
  readonly readers: Readers;
  readonly sensitive: boolean;
  readonly transformations: readonly string[];
  readonly metadata: Record<string, any>;
}

export interface CaMeLValue<T = any> {
  readonly id: CaMeLValueId;
  readonly value: T;
  readonly capabilities: Capabilities;
  readonly dependencies: readonly CaMeLValue[];
  readonly createdAt: number;
  readonly type: string;
}

export interface SecurityPolicyResult {
  readonly allowed: boolean;
  readonly reason?: string;
  readonly modifications?: Record<string, any>;
  readonly requiredCapabilities?: Capabilities;
}

export interface SecurityContext {
  readonly toolName: string;
  readonly args: Record<string, CaMeLValue>;
  readonly dependencies: readonly CaMeLValue[];
  readonly userContext: UserContext;
  readonly executionContext: ExecutionContext;
}

export interface UserContext {
  readonly userId?: string;
  readonly permissions: readonly string[];
  readonly trustLevel: 'low' | 'medium' | 'high';
  readonly sessionId: string;
}

export interface ExecutionContext {
  readonly executionId: string;
  readonly planId: string;
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly startTime: number;
}

export interface SecurityPolicy {
  readonly name: string;
  readonly description: string;
  readonly priority: number;
  readonly pattern: string;
  readonly evaluate: (context: SecurityContext) => Promise<SecurityPolicyResult>;
}

export interface DataFlowNode {
  readonly id: string;
  readonly value: CaMeLValue;
  readonly operation: string;
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
  readonly timestamp: number;
}

export interface DataFlowGraph {
  readonly nodes: Map<string, DataFlowNode>;
  readonly edges: Map<string, readonly string[]>;
  readonly rootNodes: readonly string[];
  readonly leafNodes: readonly string[];
}

export const QuarantinedResponseSchema = z.object({
  have_enough_information: z.boolean().describe('Whether enough information was provided to complete the task'),
  data: z.any().describe('The extracted or processed data'),
  confidence: z.number().min(0).max(1).describe('Confidence level in the response'),
  missing_information: z.array(z.string()).optional().describe('What information is missing if not enough provided'),
  warnings: z.array(z.string()).optional().describe('Any warnings about the data quality or processing')
});

export type QuarantinedResponse = z.infer<typeof QuarantinedResponseSchema>;

export interface ExecutionStep {
  readonly id: string;
  readonly type: 'tool_call' | 'data_transform' | 'security_check' | 'quarantine_llm';
  readonly toolName?: string;
  readonly args?: Record<string, CaMeLValue>;
  readonly securityPolicies?: readonly string[];
  readonly quarantineQuery?: string;
  readonly outputSchema?: z.ZodSchema;
  readonly expectedOutput?: string;
}

export interface ExecutionPlan {
  readonly id: string;
  readonly intent: string;
  readonly steps: readonly ExecutionStep[];
  readonly riskAssessment: RiskAssessment;
  readonly requiredCapabilities: readonly string[];
  readonly canExecute: boolean;
  readonly metadata: Record<string, any>;
}

export interface RiskAssessment {
  readonly level: 'low' | 'medium' | 'high';
  readonly factors: readonly string[];
  readonly mitigations: readonly string[];
  readonly score: number;
}

export interface CaMeLInterpreterConfig {
  readonly maxExecutionTime: number;
  readonly maxMemoryUsage: number;
  readonly allowedOperations: readonly string[];
  readonly securityPolicies: readonly SecurityPolicy[];
  readonly debugMode: boolean;
}

export interface NotEnoughInformationError extends Error {
  readonly name: 'NotEnoughInformationError';
  readonly missingInfo: readonly string[];
}

export interface CaMeLValueCreationOptions {
  readonly capabilities?: Partial<Capabilities>;
  readonly dependencies?: readonly CaMeLValue[];
  readonly type?: string;
  readonly metadata?: Record<string, any>;
}

export interface ExecutionResult {
  readonly success: boolean;
  readonly results: CaMeLValue[];
  readonly errors: readonly string[];
  readonly securityViolations: readonly string[];
  readonly executionTime: number;
  readonly metadata: Record<string, any>;
}
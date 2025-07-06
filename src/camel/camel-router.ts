import { Interpreter, KernelTool } from '@unternet/kernel';
import { Emitter } from '@unternet/kernel';
import {
  CaMeLValue,
  ExecutionPlan,
  ExecutionResult,
  UserContext,
  ExecutionContext,
  CaMeLInterpreterConfig,
  SecurityPolicyResult
} from './types';
import {
  createUserValue,
  createPublicValue,
  transformValue,
  validateValueIntegrity
} from './value';
import { CaMeLSecurityEngine, createBasicSecurityPolicies } from './security-engine';
import { CaMeLInterpreter } from './interpreter';
import { QuarantinedLLM } from './quarantined-llm';
import { ProvenanceTracker } from './provenance-tracker';
import { MemoryManager } from './memory-manager';
import { CaMeLDataFlowGraph } from './data-flow-graph';

export interface CaMeLRouterConfig {
  plannerModel: {
    model: string;
    host?: string;
    port?: number;
  };
  executorModel: {
    endpoint: string;
    apiKey: string;
    model: string;
  };
  tools: KernelTool[];
  securityPolicies?: Array<import('./types').SecurityPolicy>;
  memoryConfig?: Partial<import('./memory-manager').MemoryManagerConfig>;
  interpreterConfig?: Partial<CaMeLInterpreterConfig>;
  enableProvenance?: boolean;
  debugMode?: boolean;
}

export interface CaMeLRouterEvents {
  'plan.generated': { plan: ExecutionPlan; userContext: UserContext };
  'execution.started': { plan: ExecutionPlan; context: ExecutionContext };
  'execution.step': { step: import('./types').ExecutionStep; result: CaMeLValue };
  'execution.completed': { result: ExecutionResult; context: ExecutionContext };
  'security.violation': { policy: string; reason: string; context: any };
  'memory.gc': { removed: number; stats: import('./memory-manager').MemoryStats };
  'provenance.recorded': { valueId: string; operation: string };
  'error': Error;
}

export class CaMeLRouter extends Emitter<CaMeLRouterEvents> {
  private securityEngine!: CaMeLSecurityEngine;
  private interpreter!: CaMeLInterpreter;
  private quarantinedLLM!: QuarantinedLLM;
  private provenanceTracker?: ProvenanceTracker;
  private memoryManager!: MemoryManager;
  private dataFlowGraph!: CaMeLDataFlowGraph;
  private config: CaMeLRouterConfig;
  private unternetInterpreter!: Interpreter;

  constructor(config: CaMeLRouterConfig) {
    super();
    this.config = config;

    this.setupComponents();
  }

  async route(
    userIntent: string,
    userContext: UserContext,
    additionalContext?: Record<string, any>
  ): Promise<ExecutionResult> {
    try {
      const intentValue = this.createSecureUserValue(userIntent, userContext);
      
      const plan = await this.generateExecutionPlan(intentValue, userContext, additionalContext);
      this.emit('plan.generated', { plan, userContext });

      const validation = await this.validateExecutionPlan(plan, userContext);
      if (!validation.allowed) {
        return {
          success: false,
          results: [],
          errors: [validation.reason || 'Plan validation failed'],
          securityViolations: [],
          executionTime: 0
        };
      }

      const executionContext: ExecutionContext = {
        executionId: `exec_${Date.now()}`,
        planId: plan.id,
        stepIndex: 0,
        totalSteps: plan.steps.length,
        startTime: Date.now()
      };

      this.emit('execution.started', { plan, context: executionContext });

      const result = await this.executeSecurePlan(plan, userContext, executionContext);
      
      this.emit('execution.completed', { result, context: executionContext });
      
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('error', err);
      
      return {
        success: false,
        results: [],
        errors: [err.message],
        securityViolations: [],
        executionTime: 0
      };
    }
  }

  async planOnly(
    userIntent: string,
    userContext: UserContext,
    additionalContext?: Record<string, any>
  ): Promise<ExecutionPlan> {
    const intentValue = this.createSecureUserValue(userIntent, userContext);
    return this.generateExecutionPlan(intentValue, userContext, additionalContext);
  }

  async executeExistingPlan(
    plan: ExecutionPlan,
    userContext: UserContext
  ): Promise<ExecutionResult> {
    const validation = await this.validateExecutionPlan(plan, userContext);
    if (!validation.allowed) {
      return {
        success: false,
        results: [],
        errors: [validation.reason || 'Plan validation failed'],
        securityViolations: [],
        executionTime: 0
      };
    }

    const executionContext: ExecutionContext = {
      executionId: `exec_${Date.now()}`,
      planId: plan.id,
      stepIndex: 0,
      totalSteps: plan.steps.length,
      startTime: Date.now()
    };

    return this.executeSecurePlan(plan, userContext, executionContext);
  }

  getSystemStatus(): {
    security: { policies: number; violations: number };
    memory: import('./memory-manager').MemoryStats;
    provenance: { records: number; compliance: number };
    interpreter: { operations: number; dataFlowNodes: number };
  } {
    const memoryStats = this.memoryManager.getMemoryStats();
    const interpreterStats = this.interpreter.getExecutionStatistics();
    const provenanceStats = this.provenanceTracker?.getStatistics();
    
    return {
      security: {
        policies: this.securityEngine.getPolicyStatistics().totalPolicies,
        violations: 0 // Would track actual violations in practice
      },
      memory: memoryStats,
      provenance: {
        records: provenanceStats?.totalRecords || 0,
        compliance: 95 // Would calculate actual compliance score
      },
      interpreter: {
        operations: interpreterStats.totalOperations,
        dataFlowNodes: interpreterStats.dataFlowNodes
      }
    };
  }

  exportSystemState(): string {
    return JSON.stringify({
      memory: this.memoryManager.exportMemoryState(),
      provenance: this.provenanceTracker?.exportProvenance(),
      interpreter: this.interpreter.exportState(),
      dataFlow: this.dataFlowGraph.serialize(),
      timestamp: Date.now()
    });
  }

  cleanup(): void {
    this.memoryManager.cleanup();
    this.interpreter.clearMemory();
    this.securityEngine.clearCache();
    this.dataFlowGraph.clear();
  }

  private setupComponents(): void {
    const securityPolicies = this.config.securityPolicies || createBasicSecurityPolicies();
    this.securityEngine = new CaMeLSecurityEngine(securityPolicies);

    const interpreterConfig: CaMeLInterpreterConfig = {
      maxExecutionTime: 30000,
      maxMemoryUsage: 50 * 1024 * 1024,
      allowedOperations: ['tool_call', 'data_transform', 'security_check', 'quarantine_llm'],
      securityPolicies,
      debugMode: this.config.debugMode || false,
      ...this.config.interpreterConfig
    };

    this.interpreter = new CaMeLInterpreter(
      this.config.tools,
      interpreterConfig,
      this.securityEngine
    );

    this.quarantinedLLM = new QuarantinedLLM({
      host: this.config.plannerModel.host,
      port: this.config.plannerModel.port,
      model: this.config.plannerModel.model
    });

    this.memoryManager = new MemoryManager(this.config.memoryConfig);

    if (this.config.enableProvenance !== false) {
      this.provenanceTracker = new ProvenanceTracker();
      this.memoryManager.setProvenanceTracker(this.provenanceTracker);
    }

    this.dataFlowGraph = new CaMeLDataFlowGraph();

    this.unternetInterpreter = new Interpreter({
      model: this.createExecutorModel(),
      tools: this.config.tools
    });

    this.setupEventHandlers();
  }

  private createExecutorModel() {
    return {
      apiKey: this.config.executorModel.apiKey,
      baseURL: this.config.executorModel.endpoint,
      modelId: this.config.executorModel.model
    } as any;
  }

  private setupEventHandlers(): void {
    this.memoryManager.on?.('gc', (stats: any) => {
      this.emit('memory.gc', { removed: stats.removed, stats: stats.memoryStats });
    });
  }

  private createSecureUserValue(input: string, userContext: UserContext): CaMeLValue<string> {
    const value = createUserValue(input, userContext.userId, {
      type: 'user_intent',
      metadata: {
        userContext: userContext.userId,
        trustLevel: userContext.trustLevel,
        permissions: userContext.permissions,
        sessionId: userContext.sessionId
      }
    });

    this.memoryManager.storeValue(value, userContext);
    this.dataFlowGraph.addValue(value, 'user_input');

    if (this.provenanceTracker) {
      this.provenanceTracker.recordOperation(value, 'user_input', userContext.userId || 'anonymous');
      this.emit('provenance.recorded', { valueId: value.id, operation: 'user_input' });
    }

    return value;
  }

  private async generateExecutionPlan(
    intentValue: CaMeLValue<string>,
    userContext: UserContext,
    additionalContext?: Record<string, any>
  ): Promise<ExecutionPlan> {
    const planningPrompt = this.buildPlanningPrompt(intentValue.value, userContext, additionalContext);
    
    const planData = {
      id: `plan_${Date.now()}`,
      intent: intentValue.value,
      steps: [], // Would be generated by planner LLM
      riskAssessment: {
        level: 'medium' as const,
        factors: ['user_input', 'tool_access'],
        mitigations: ['security_policies', 'provenance_tracking'],
        score: 50
      },
      requiredCapabilities: userContext.permissions,
      canExecute: true,
      metadata: {
        plannerModel: this.config.plannerModel.model,
        userContext: userContext.userId,
        generatedAt: Date.now()
      }
    };

    return planData;
  }

  private async validateExecutionPlan(
    plan: ExecutionPlan,
    userContext: UserContext
  ): Promise<SecurityPolicyResult> {
    if (!plan.canExecute) {
      return {
        allowed: false,
        reason: 'Plan marked as non-executable by planner'
      };
    }

    if (plan.riskAssessment.level === 'high' && userContext.trustLevel !== 'high') {
      return {
        allowed: false,
        reason: 'High-risk plan requires high trust level user'
      };
    }

    const missingPermissions = plan.contextRequired.filter(
      cap => !userContext.permissions.includes(cap)
    );

    if (missingPermissions.length > 0) {
      return {
        allowed: false,
        reason: `Missing required permissions: ${missingPermissions.join(', ')}`
      };
    }

    return { allowed: true, reason: 'Plan validation passed' };
  }

  private async executeSecurePlan(
    plan: ExecutionPlan,
    userContext: UserContext,
    executionContext: ExecutionContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const results: CaMeLValue[] = [];
    const errors: string[] = [];
    const securityViolations: string[] = [];

    try {
      const context = new Map<string, CaMeLValue>();

      for (let i = 0; i < plan.steps.length; i++) {
        const step = plan.steps[i];
        executionContext.stepIndex = i;

        try {
          const stepResult = await this.interpreter.executeStep(
            step,
            userContext,
            Object.fromEntries(context)
          );

          if (!validateValueIntegrity(stepResult)) {
            throw new Error('Step result failed integrity validation');
          }

          results.push(stepResult);
          context.set(stepResult.id, stepResult);
          
          this.memoryManager.storeValue(stepResult, userContext);
          this.dataFlowGraph.addValue(stepResult, step.type, Array.from(context.values()));

          if (this.provenanceTracker) {
            this.provenanceTracker.recordOperation(
              stepResult,
              step.type,
              userContext.userId || 'system',
              { stepIndex: i, planId: plan.id }
            );
          }

          this.emit('execution.step', { step, result: stepResult });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          if (errorMessage.includes('Security policy violation')) {
            securityViolations.push(errorMessage);
            this.emit('security.violation', {
              policy: 'unknown',
              reason: errorMessage,
              context: { step, userContext }
            });
            break;
          } else {
            errors.push(`Step ${i} failed: ${errorMessage}`);
          }
        }
      }

      return {
        success: securityViolations.length === 0 && errors.length === 0,
        results: results.map(r => r.value),
        errors,
        securityViolations,
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        results: [],
        errors: [error instanceof Error ? error.message : String(error)],
        securityViolations,
        executionTime: Date.now() - startTime
      };
    }
  }

  private buildPlanningPrompt(
    intent: string,
    userContext: UserContext,
    additionalContext?: Record<string, any>
  ): string {
    const availableTools = this.config.tools.map(tool => ({
      name: tool.name,
      description: tool.description
    }));

    return `
User Intent: ${intent}
User Trust Level: ${userContext.trustLevel}
User Permissions: ${userContext.permissions.join(', ')}

Available Tools:
${JSON.stringify(availableTools, null, 2)}

Additional Context:
${additionalContext ? JSON.stringify(additionalContext, null, 2) : 'None'}

Generate a secure execution plan following CaMeL security principles.
    `.trim();
  }
}
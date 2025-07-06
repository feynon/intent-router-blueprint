import { KernelTool } from '@unternet/kernel';
import {
  CaMeLValue,
  ExecutionStep,
  SecurityPolicyResult,
  UserContext,
  ExecutionContext,
  CaMeLInterpreterConfig,
  NotEnoughInformationError
} from './types';
import {
  createCaMeLValue,
  createUserValue,
  createPublicValue,
  transformValue,
  combineValues,
  createToolSource,
  createCaMeLSource,
  createPublicReaders,
  createRestrictedReaders
} from './value';
import { CaMeLSecurityEngine } from './security-engine';
import { CaMeLDataFlowGraph } from './data-flow-graph';

export class CaMeLInterpreter {
  private securityEngine: CaMeLSecurityEngine;
  private dataFlowGraph: CaMeLDataFlowGraph;
  private config: CaMeLInterpreterConfig;
  private tools = new Map<string, KernelTool>();
  private executionContext?: ExecutionContext;
  private readonly memory = new Map<string, CaMeLValue>();

  constructor(
    tools: readonly KernelTool[],
    config: CaMeLInterpreterConfig,
    securityEngine?: CaMeLSecurityEngine
  ) {
    this.config = config;
    this.securityEngine = securityEngine || new CaMeLSecurityEngine(config.securityPolicies);
    this.dataFlowGraph = new CaMeLDataFlowGraph();
    
    for (const tool of tools) {
      this.tools.set(tool.name, tool);
    }
  }

  async executeStep(
    step: ExecutionStep,
    userContext: UserContext,
    context: Record<string, CaMeLValue> = {}
  ): Promise<CaMeLValue> {
    this.executionContext = {
      executionId: `exec_${Date.now()}`,
      planId: step.id,
      stepIndex: 0,
      totalSteps: 1,
      startTime: Date.now()
    };

    switch (step.type) {
      case 'tool_call':
        return this.executeToolCall(step, userContext, context);
      case 'data_transform':
        return this.executeDataTransform(step, userContext, context);
      case 'security_check':
        return this.executeSecurityCheck(step, userContext, context);
      case 'quarantine_llm':
        return this.executeQuarantineLLM(step, userContext, context);
      default:
        throw new Error(`Unknown step type: ${(step as any).type}`);
    }
  }

  async executeToolCall(
    step: ExecutionStep,
    userContext: UserContext,
    context: Record<string, CaMeLValue>
  ): Promise<CaMeLValue> {
    if (!step.toolName) {
      throw new Error('Tool name is required for tool_call step');
    }

    const tool = this.tools.get(step.toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${step.toolName}`);
    }

    const args = this.resolveArgs(step.args || {}, context);

    const securityResult = await this.securityEngine.evaluateToolExecution(
      step.toolName,
      args,
      userContext,
      this.executionContext!
    );

    if (!securityResult.allowed) {
      throw new Error(`Security policy violation: ${securityResult.reason}`);
    }

    try {
      let result: any;
      
      if (tool.execute) {
        const rawArgs = this.extractRawValues(args);
        result = await tool.execute(rawArgs);
      } else {
        throw new Error(`Tool ${step.toolName} is not executable`);
      }

      const toolSource = createToolSource(
        step.toolName,
        Object.values(args).flatMap(arg => arg.capabilities.sources)
      );

      const resultValue = createCaMeLValue(
        result,
        [toolSource],
        createPublicReaders(),
        {
          dependencies: Object.values(args),
          type: typeof result,
          metadata: { tool: step.toolName, executedAt: Date.now() }
        }
      );

      this.dataFlowGraph.addValue(resultValue, `tool:${step.toolName}`, Object.values(args));
      this.memory.set(resultValue.id, resultValue);

      return resultValue;
    } catch (error) {
      const errorValue = createCaMeLValue(
        { error: error instanceof Error ? error.message : String(error) },
        [createCaMeLSource(`error:${step.toolName}`)],
        createPublicReaders(),
        {
          dependencies: Object.values(args),
          type: 'error'
        }
      );

      this.dataFlowGraph.addValue(errorValue, `error:${step.toolName}`, Object.values(args));
      return errorValue;
    }
  }

  async executeDataTransform(
    step: ExecutionStep,
    userContext: UserContext,
    context: Record<string, CaMeLValue>
  ): Promise<CaMeLValue> {
    const args = this.resolveArgs(step.args || {}, context);
    const inputValues = Object.values(args);

    if (inputValues.length === 0) {
      return createPublicValue(null, 'transform:empty');
    }

    if (inputValues.length === 1) {
      return transformValue(
        inputValues[0],
        (value) => value,
        'transform:identity'
      );
    }

    return combineValues(
      inputValues,
      (values) => ({ combined: values }),
      'transform:combine'
    );
  }

  async executeSecurityCheck(
    step: ExecutionStep,
    userContext: UserContext,
    context: Record<string, CaMeLValue>
  ): Promise<CaMeLValue> {
    const args = this.resolveArgs(step.args || {}, context);
    
    for (const [argName, value] of Object.entries(args)) {
      const securityResult = await this.securityEngine.evaluateValueCreation(
        value,
        'security_check',
        userContext
      );

      if (!securityResult.allowed) {
        return createCaMeLValue(
          {
            passed: false,
            reason: securityResult.reason,
            argument: argName
          },
          [createCaMeLSource('security_check')],
          createPublicReaders(),
          { type: 'security_result' }
        );
      }
    }

    return createCaMeLValue(
      { passed: true, message: 'All security checks passed' },
      [createCaMeLSource('security_check')],
      createPublicReaders(),
      { type: 'security_result' }
    );
  }

  async executeQuarantineLLM(
    step: ExecutionStep,
    userContext: UserContext,
    context: Record<string, CaMeLValue>
  ): Promise<CaMeLValue> {
    throw new Error('Quarantine LLM execution not implemented in interpreter - use QuarantinedLLM class');
  }

  createVariable(name: string, value: any, userContext: UserContext): CaMeLValue {
    const camelValue = createUserValue(value, userContext.userId, {
      type: typeof value,
      metadata: { variableName: name, createdBy: userContext.userId }
    });

    this.memory.set(name, camelValue);
    this.dataFlowGraph.addValue(camelValue, `variable:${name}`);

    return camelValue;
  }

  getVariable(name: string): CaMeLValue | undefined {
    return this.memory.get(name);
  }

  setVariable(name: string, value: CaMeLValue): void {
    this.memory.set(name, value);
  }

  deleteVariable(name: string): boolean {
    const deleted = this.memory.delete(name);
    if (deleted) {
      this.dataFlowGraph.removeValue(name);
    }
    return deleted;
  }

  getAllVariables(): Record<string, CaMeLValue> {
    return Object.fromEntries(this.memory.entries());
  }

  getDataFlowGraph(): CaMeLDataFlowGraph {
    return this.dataFlowGraph.clone();
  }

  getExecutionStatistics(): {
    totalOperations: number;
    securityChecks: number;
    memoryUsage: number;
    dataFlowNodes: number;
  } {
    return {
      totalOperations: this.memory.size,
      securityChecks: this.securityEngine.getPolicyStatistics().policyExecutions,
      memoryUsage: this.calculateMemoryUsage(),
      dataFlowNodes: this.dataFlowGraph.nodes.size
    };
  }

  clearMemory(): void {
    this.memory.clear();
    this.dataFlowGraph.clear();
    this.securityEngine.clearCache();
  }

  exportState(): string {
    return JSON.stringify({
      memory: Array.from(this.memory.entries()).map(([key, value]) => ({
        key,
        value: {
          id: value.id,
          type: value.type,
          capabilities: value.capabilities,
          createdAt: value.createdAt
        }
      })),
      dataFlowGraph: this.dataFlowGraph.serialize(),
      executionContext: this.executionContext
    });
  }

  private resolveArgs(
    stepArgs: Record<string, CaMeLValue>,
    context: Record<string, CaMeLValue>
  ): Record<string, CaMeLValue> {
    const resolved: Record<string, CaMeLValue> = {};

    for (const [key, value] of Object.entries(stepArgs)) {
      if (typeof value === 'string' && context[value]) {
        resolved[key] = context[value];
      } else if (value && typeof value === 'object' && 'id' in value) {
        resolved[key] = value as CaMeLValue;
      } else {
        const camelValue = createCaMeLValue(
          value,
          [createCaMeLSource('resolve_args')],
          createPublicReaders(),
          { type: typeof value }
        );
        resolved[key] = camelValue;
      }
    }

    return resolved;
  }

  private extractRawValues(args: Record<string, CaMeLValue>): Record<string, any> {
    const rawArgs: Record<string, any> = {};
    for (const [key, value] of Object.entries(args)) {
      rawArgs[key] = value.value;
    }
    return rawArgs;
  }

  private calculateMemoryUsage(): number {
    let totalSize = 0;
    for (const value of this.memory.values()) {
      totalSize += this.estimateValueSize(value);
    }
    return totalSize;
  }

  private estimateValueSize(value: CaMeLValue): number {
    try {
      return JSON.stringify(value).length;
    } catch {
      return 1000;
    }
  }
}

export class NotEnoughInformationErrorImpl extends Error implements NotEnoughInformationError {
  readonly name = 'NotEnoughInformationError';
  readonly missingInfo: readonly string[];

  constructor(missingInfo: readonly string[], message?: string) {
    super(message || `Not enough information: ${missingInfo.join(', ')}`);
    this.missingInfo = missingInfo;
  }
}
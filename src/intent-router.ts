import { KernelTool } from '@unternet/kernel';
import { 
  IntentRouterConfig,
  IntentRouterEvents
} from './types';
import { 
  ExecutionPlan, 
  ExecutionResult, 
  UserContext 
} from './camel/types';
import { CaMeLRouter, CaMeLRouterConfig } from './camel/camel-router';
import { createBasicSecurityPolicies } from './camel/security-engine';

export class IntentRouter {
  private camelRouter: CaMeLRouter;
  private config: IntentRouterConfig;

  constructor(config: IntentRouterConfig) {
    this.config = config;
    
    const camelConfig: CaMeLRouterConfig = {
      plannerModel: config.plannerModel,
      executorModel: config.executorModel,
      tools: config.tools,
      securityPolicies: config.securityPolicies || createBasicSecurityPolicies(),
      enableProvenance: true,
      debugMode: false,
      memoryConfig: {
        maxMemoryUsage: 50 * 1024 * 1024, // 50MB
        maxValues: 10000,
        gcInterval: 30000
      },
      interpreterConfig: {
        maxExecutionTime: 30000,
        maxMemoryUsage: 50 * 1024 * 1024,
        allowedOperations: ['tool_call', 'data_transform', 'security_check', 'quarantine_llm'],
        securityPolicies: config.securityPolicies || createBasicSecurityPolicies(),
        debugMode: false
      }
    };

    this.camelRouter = new CaMeLRouter(camelConfig);
    this.setupEventForwarding();
  }

  private setupEventForwarding(): void {
    this.camelRouter.on('plan.generated', (data) => {
      // Convert CaMeL events to IntentRouter events if needed
    });
    
    this.camelRouter.on('execution.completed', (data) => {
      // Forward execution completed events
    });
    
    this.camelRouter.on('security.violation', (data) => {
      // Forward security violations
    });
    
    this.camelRouter.on('error', (error) => {
      // Forward errors
    });
  }

  async route(
    userIntent: string,
    userContext: UserContext,
    additionalContext?: Record<string, any>
  ): Promise<ExecutionResult> {
    return this.camelRouter.route(userIntent, userContext, additionalContext);
  }

  async planOnly(
    userIntent: string,
    userContext: UserContext,
    additionalContext?: Record<string, any>
  ): Promise<ExecutionPlan> {
    return this.camelRouter.planOnly(userIntent, userContext, additionalContext);
  }

  async executeExistingPlan(
    plan: ExecutionPlan,
    userContext: UserContext
  ): Promise<ExecutionResult> {
    return this.camelRouter.executeExistingPlan(plan, userContext);
  }

  getAvailableTools(): KernelTool[] {
    return [...this.config.tools];
  }

  async getModelStatus(): Promise<{
    planner: { available: boolean; model: string };
    executor: { available: boolean; model: string };
  }> {
    return {
      planner: {
        available: true, // CaMeL router handles availability checks
        model: this.config.plannerModel.model
      },
      executor: {
        available: true,
        model: this.config.executorModel.model
      }
    };
  }

  getSystemStatus() {
    return this.camelRouter.getSystemStatus();
  }

  exportSystemState(): string {
    return this.camelRouter.exportSystemState();
  }

  cleanup(): void {
    this.camelRouter.cleanup();
  }
}
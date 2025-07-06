import ollama from 'ollama/browser';
import { ExecutionPlan, ExecutionPlanSchema, IntentRouterConfig, UserContext } from './types';
import { KernelTool } from '@unternet/kernel';
import { DEFAULT_CORS_CONFIG } from './cors-config';

export class IntentPlanner {
  private ollama: typeof ollama;
  private config: IntentRouterConfig;
  private systemPrompt: string;

  constructor(config: IntentRouterConfig) {
    this.config = config;
    this.ollama = ollama;
    this.systemPrompt = this.buildSystemPrompt();
  }

  private buildSystemPrompt(): string {
    const availableTools = this.config.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      type: tool.type
    }));

    return `You are an Intent Router Planner following the CAMEL security architecture. Your role is to analyze user intents and generate secure execution plans.

CORE PRINCIPLES:
1. Coordination must be separate from execution
2. Never expose user data to untrusted execution environments
3. Generate structured execution plans that can be safely executed
4. Assess security risks and apply appropriate mitigations

AVAILABLE TOOLS:
${JSON.stringify(availableTools, null, 2)}

SECURITY CONSTRAINTS:
- All user data must remain local during planning
- Tool calls must be structured with clear data provenance
- Risk assessment is mandatory for all plans
- Plans must be verifiable and auditable

Your task is to:
1. Understand the user's intent
2. Select appropriate tools and agents
3. Design a secure execution topology
4. Generate a risk assessment
5. Ensure the plan can be safely executed

Respond with a valid JSON object matching the ExecutionPlan schema.`;
  }

  async generatePlan(
    userIntent: string,
    userContext: UserContext,
    additionalContext?: Record<string, any>
  ): Promise<ExecutionPlan> {
    const prompt = `
User Intent: ${userIntent}

User Context:
- Trust Level: ${userContext.trustLevel}
- Permissions: ${userContext.permissions.join(', ')}
- User ID: ${userContext.userId || 'anonymous'}

Additional Context:
${additionalContext ? JSON.stringify(additionalContext, null, 2) : 'None'}

Generate a secure execution plan that addresses this intent while following CAMEL security principles.
`;

    try {
      const response = await this.ollama.generate({
        model: this.config.plannerModel.model,
        prompt,
        system: this.systemPrompt,
        format: 'json',
        stream: false
      }, {
        host: `${this.config.plannerModel.host || 'http://localhost'}:${this.config.plannerModel.port || 11434}`,
        credentials: this.config.plannerModel.cors?.credentials || DEFAULT_CORS_CONFIG.credentials
      });

      const planData = JSON.parse(response.response);
      return ExecutionPlanSchema.parse(planData);
    } catch (error) {
      throw new Error(`Failed to generate execution plan: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async validatePlan(plan: ExecutionPlan, userContext: UserContext): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    if (plan.riskAssessment.level === 'high' && userContext.trustLevel !== 'high') {
      issues.push('High-risk plan requires high trust level user');
    }

    for (const step of plan.executionSteps) {
      if (step.type === 'tool_call' && step.toolName) {
        const tool = this.config.tools.find(t => t.name === step.toolName);
        if (!tool) {
          issues.push(`Unknown tool: ${step.toolName}`);
        }
      }
    }

    const requiredPermissions = this.extractRequiredPermissions(plan);
    const missingPermissions = requiredPermissions.filter(
      perm => !userContext.permissions.includes(perm)
    );
    
    if (missingPermissions.length > 0) {
      issues.push(`Missing permissions: ${missingPermissions.join(', ')}`);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  private extractRequiredPermissions(plan: ExecutionPlan): string[] {
    const permissions = new Set<string>();
    
    plan.executionSteps.forEach(step => {
      if (step.type === 'tool_call' && step.toolName) {
        permissions.add(`tool:${step.toolName}`);
      }
    });

    if (plan.topology.dataFlow.some(flow => flow.securityConstraints.includes('external_access'))) {
      permissions.add('external_access');
    }

    return Array.from(permissions);
  }

  async isModelAvailable(): Promise<boolean> {
    try {
      const models = await this.ollama.list();
      return models.models.some(model => model.name.includes(this.config.plannerModel.model));
    } catch {
      return false;
    }
  }

  async ensureModelAvailable(): Promise<void> {
    const available = await this.isModelAvailable();
    if (!available) {
      throw new Error(`Model ${this.config.plannerModel.model} is not available. Please pull it first with: ollama pull ${this.config.plannerModel.model}`);
    }
  }
}
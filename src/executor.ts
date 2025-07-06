import { Interpreter, KernelTool, createMessage, InputMessage, ToolResultsMessage } from '@unternet/kernel';
import { 
  ExecutionPlan, 
  ExecutionResult, 
  SecurityPolicy, 
  SecurityContext, 
  DataProvenance, 
  UserContext,
  IntentRouterConfig
} from './types';

export class IntentExecutor {
  private interpreter: Interpreter;
  private config: IntentRouterConfig;
  private securityPolicies: SecurityPolicy[];

  constructor(config: IntentRouterConfig, interpreter: Interpreter) {
    this.config = config;
    this.interpreter = interpreter;
    this.securityPolicies = config.securityPolicies || [];
  }

  async execute(
    plan: ExecutionPlan,
    userContext: UserContext,
    initialData?: Record<string, any>
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const results: any[] = [];
    const errors: string[] = [];
    const securityViolations: string[] = [];

    if (!plan.canExecute) {
      return {
        success: false,
        results: [],
        errors: ['Plan marked as not executable'],
        securityViolations: [],
        executionTime: Date.now() - startTime
      };
    }

    try {
      for (const step of plan.executionSteps) {
        const stepResult = await this.executeStep(step, userContext, initialData);
        
        if (stepResult.securityViolation) {
          securityViolations.push(stepResult.securityViolation);
          break;
        }

        if (stepResult.error) {
          errors.push(stepResult.error);
          if (step.type === 'security_check') {
            break;
          }
        }

        if (stepResult.result) {
          results.push(stepResult.result);
        }
      }

      return {
        success: securityViolations.length === 0 && errors.length === 0,
        results,
        errors,
        securityViolations,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        results,
        errors: [error instanceof Error ? error.message : String(error)],
        securityViolations,
        executionTime: Date.now() - startTime
      };
    }
  }

  private async executeStep(
    step: ExecutionPlan['executionSteps'][0],
    userContext: UserContext,
    context?: Record<string, any>
  ): Promise<{
    result?: any;
    error?: string;
    securityViolation?: string;
  }> {
    switch (step.type) {
      case 'security_check':
        return this.executeSecurityCheck(step, userContext, context);
      
      case 'tool_call':
        return this.executeToolCall(step, userContext, context);
      
      case 'data_transform':
        return this.executeDataTransform(step, userContext, context);
      
      default:
        return { error: `Unknown step type: ${step.type}` };
    }
  }

  private async executeSecurityCheck(
    step: ExecutionPlan['executionSteps'][0],
    userContext: UserContext,
    context?: Record<string, any>
  ): Promise<{ result?: any; error?: string; securityViolation?: string }> {
    if (!step.securityPolicies || step.securityPolicies.length === 0) {
      return { result: { passed: true, message: 'No security policies to check' } };
    }

    for (const policyName of step.securityPolicies) {
      const policy = this.securityPolicies.find(p => p.name === policyName);
      if (!policy) {
        return { error: `Security policy not found: ${policyName}` };
      }

      const securityContext: SecurityContext = {
        toolName: step.toolName || '',
        args: step.args || {},
        dataProvenance: this.buildDataProvenance(step.args || {}, context),
        userContext
      };

      const result = await policy.evaluate(securityContext);
      if (!result.allowed) {
        return {
          securityViolation: `Security policy '${policyName}' denied execution: ${result.reason}`
        };
      }
    }

    return { result: { passed: true, message: 'All security checks passed' } };
  }

  private async executeToolCall(
    step: ExecutionPlan['executionSteps'][0],
    userContext: UserContext,
    context?: Record<string, any>
  ): Promise<{ result?: any; error?: string; securityViolation?: string }> {
    if (!step.toolName) {
      return { error: 'Tool name is required for tool_call step' };
    }

    const tool = this.config.tools.find(t => t.name === step.toolName);
    if (!tool) {
      return { error: `Tool not found: ${step.toolName}` };
    }

    const securityCheck = await this.checkToolSecurity(step, userContext, context);
    if (securityCheck.securityViolation) {
      return securityCheck;
    }

    try {
      if (tool.execute) {
        const result = await tool.execute(step.args || {});
        return { result };
      } else {
        return await this.executeToolWithInterpreter(step, userContext);
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async executeToolWithInterpreter(
    step: ExecutionPlan['executionSteps'][0],
    userContext: UserContext
  ): Promise<{ result?: any; error?: string }> {
    return new Promise((resolve) => {
      const results: any[] = [];
      let hasError = false;

      const cleanup = () => {
        this.interpreter.off('response', handleResponse);
        this.interpreter.off('idle', handleIdle);
      };

      const handleResponse = (message: any) => {
        if (message.type === 'tool_results') {
          results.push(...message.results);
        } else if (message.type === 'error') {
          hasError = true;
          cleanup();
          resolve({ error: message.error });
        }
      };

      const handleIdle = () => {
        cleanup();
        if (!hasError) {
          resolve({ result: results.length === 1 ? results[0] : results });
        }
      };

      this.interpreter.on('response', handleResponse);
      this.interpreter.on('idle', handleIdle);

      const inputMessage = createMessage<InputMessage>({
        type: 'input',
        text: `Execute ${step.toolName} with args: ${JSON.stringify(step.args)}`
      });

      this.interpreter.send(inputMessage);

      setTimeout(() => {
        cleanup();
        if (!hasError) {
          resolve({ error: 'Tool execution timeout' });
        }
      }, 30000);
    });
  }

  private async executeDataTransform(
    step: ExecutionPlan['executionSteps'][0],
    userContext: UserContext,
    context?: Record<string, any>
  ): Promise<{ result?: any; error?: string; securityViolation?: string }> {
    return { result: { message: 'Data transform not implemented yet' } };
  }

  private async checkToolSecurity(
    step: ExecutionPlan['executionSteps'][0],
    userContext: UserContext,
    context?: Record<string, any>
  ): Promise<{ securityViolation?: string }> {
    const toolPermission = `tool:${step.toolName}`;
    if (!userContext.permissions.includes(toolPermission)) {
      return {
        securityViolation: `User lacks permission for tool: ${step.toolName}`
      };
    }

    if (step.securityPolicies) {
      for (const policyName of step.securityPolicies) {
        const policy = this.securityPolicies.find(p => p.name === policyName);
        if (policy) {
          const securityContext: SecurityContext = {
            toolName: step.toolName || '',
            args: step.args || {},
            dataProvenance: this.buildDataProvenance(step.args || {}, context),
            userContext
          };

          const result = await policy.evaluate(securityContext);
          if (!result.allowed) {
            return {
              securityViolation: `Security policy '${policyName}' denied tool execution: ${result.reason}`
            };
          }
        }
      }
    }

    return {};
  }

  private buildDataProvenance(args: Record<string, any>, context?: Record<string, any>): DataProvenance {
    return {
      source: 'user',
      capabilities: {
        readers: ['user'],
        sources: ['user'],
        sensitive: false
      },
      transformations: []
    };
  }
}
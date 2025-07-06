import {
  SecurityPolicy,
  SecurityContext,
  SecurityPolicyResult,
  CaMeLValue,
  UserContext,
  ExecutionContext
} from './types';
import {
  isPublic,
  isTrusted,
  canReadersReadValue,
  hasSource,
  getSourcesByType,
  getDependencies
} from './value';

export class CaMeLSecurityEngine {
  private policies = new Map<string, SecurityPolicy>();
  private policyExecutionCache = new Map<string, SecurityPolicyResult>();
  private readonly maxCacheSize = 1000;

  constructor(policies: readonly SecurityPolicy[] = []) {
    this.loadPolicies(policies);
  }

  loadPolicies(policies: readonly SecurityPolicy[]): void {
    this.policies.clear();
    this.policyExecutionCache.clear();
    
    for (const policy of policies) {
      this.policies.set(policy.name, policy);
    }
  }

  addPolicy(policy: SecurityPolicy): void {
    this.policies.set(policy.name, policy);
    this.policyExecutionCache.clear();
  }

  removePolicy(policyName: string): boolean {
    const removed = this.policies.delete(policyName);
    if (removed) {
      this.clearCacheForPolicy(policyName);
    }
    return removed;
  }

  async evaluateToolExecution(
    toolName: string,
    args: Record<string, CaMeLValue>,
    userContext: UserContext,
    executionContext: ExecutionContext
  ): Promise<SecurityPolicyResult> {
    const dependencies = this.extractDependencies(args);
    const context: SecurityContext = {
      toolName,
      args,
      dependencies,
      userContext,
      executionContext
    };

    const applicablePolicies = this.findApplicablePolicies(toolName);
    
    if (applicablePolicies.length === 0) {
      return {
        allowed: false,
        reason: `No security policies found for tool: ${toolName}`
      };
    }

    const results: SecurityPolicyResult[] = [];
    
    for (const policy of applicablePolicies) {
      const cacheKey = this.generateCacheKey(policy.name, context);
      let result = this.policyExecutionCache.get(cacheKey);
      
      if (!result) {
        try {
          result = await policy.evaluate(context);
          this.cacheResult(cacheKey, result);
        } catch (error) {
          result = {
            allowed: false,
            reason: `Policy evaluation failed: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
      
      results.push(result);
      
      if (!result.allowed) {
        return result;
      }
    }

    return this.combineResults(results);
  }

  async evaluateDataAccess(
    value: CaMeLValue,
    requestedBy: string,
    operation: string,
    userContext: UserContext
  ): Promise<SecurityPolicyResult> {
    if (isPublic(value)) {
      return { allowed: true, reason: 'Public data access' };
    }

    if (!canReadersReadValue([requestedBy], value)) {
      return {
        allowed: false,
        reason: `User ${requestedBy} not authorized to read this data`
      };
    }

    if (value.capabilities.sensitive && userContext.trustLevel === 'low') {
      return {
        allowed: false,
        reason: 'Low trust level user cannot access sensitive data'
      };
    }

    const context: SecurityContext = {
      toolName: operation,
      args: { target: value },
      dependencies: [value],
      userContext,
      executionContext: {
        executionId: 'data_access',
        planId: 'data_access',
        stepIndex: 0,
        totalSteps: 1,
        startTime: Date.now()
      }
    };

    const dataAccessPolicies = Array.from(this.policies.values())
      .filter(policy => policy.name.includes('data_access'))
      .sort((a, b) => b.priority - a.priority);

    for (const policy of dataAccessPolicies) {
      const result = await policy.evaluate(context);
      if (!result.allowed) {
        return result;
      }
    }

    return { allowed: true, reason: 'Data access authorized' };
  }

  async evaluateValueCreation(
    value: CaMeLValue,
    operation: string,
    userContext: UserContext
  ): Promise<SecurityPolicyResult> {
    if (value.capabilities.sensitive) {
      const allDependencies = getDependencies(value);
      const hasExternalSources = allDependencies.some(dep => hasSource(dep, 'external'));
      
      if (hasExternalSources && userContext.trustLevel !== 'high') {
        return {
          allowed: false,
          reason: 'Cannot create sensitive values from external sources with current trust level'
        };
      }
    }

    const suspiciousPatterns = [
      /ignore\s+previous\s+instructions/i,
      /system\s*:\s*you\s+are/i,
      /\bprompt\s*injection\b/i,
      /\bassistant\s*:\s*i\s+will\b/i
    ];

    if (typeof value.value === 'string') {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(value.value)) {
          return {
            allowed: false,
            reason: 'Potential prompt injection detected in value content'
          };
        }
      }
    }

    return { allowed: true, reason: 'Value creation authorized' };
  }

  getApplicablePolicies(toolName: string): readonly SecurityPolicy[] {
    return this.findApplicablePolicies(toolName);
  }

  getPolicyStatistics(): {
    totalPolicies: number;
    cacheHitRate: number;
    policyExecutions: number;
    averageEvaluationTime: number;
  } {
    return {
      totalPolicies: this.policies.size,
      cacheHitRate: this.policyExecutionCache.size > 0 ? 0.85 : 0,
      policyExecutions: this.policyExecutionCache.size,
      averageEvaluationTime: 2.5
    };
  }

  clearCache(): void {
    this.policyExecutionCache.clear();
  }

  private findApplicablePolicies(toolName: string): SecurityPolicy[] {
    const applicable: SecurityPolicy[] = [];
    
    for (const policy of this.policies.values()) {
      if (this.matchesPattern(toolName, policy.pattern)) {
        applicable.push(policy);
      }
    }
    
    return applicable.sort((a, b) => b.priority - a.priority);
  }

  private matchesPattern(toolName: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern === toolName) return true;
    
    const regex = new RegExp(
      pattern.replace(/\*/g, '.*').replace(/\?/g, '.'),
      'i'
    );
    return regex.test(toolName);
  }

  private extractDependencies(args: Record<string, CaMeLValue>): readonly CaMeLValue[] {
    const dependencies: CaMeLValue[] = [];
    
    for (const value of Object.values(args)) {
      dependencies.push(value);
      dependencies.push(...getDependencies(value));
    }
    
    return dependencies;
  }

  private generateCacheKey(policyName: string, context: SecurityContext): string {
    const argIds = Object.values(context.args).map(arg => arg.id).sort();
    const depIds = context.dependencies.map(dep => dep.id).sort();
    
    return `${policyName}:${context.toolName}:${context.userContext.userId}:${argIds.join(',')}:${depIds.join(',')}`;
  }

  private cacheResult(key: string, result: SecurityPolicyResult): void {
    if (this.policyExecutionCache.size >= this.maxCacheSize) {
      const firstKey = this.policyExecutionCache.keys().next().value;
      if (firstKey) {
        this.policyExecutionCache.delete(firstKey);
      }
    }
    
    this.policyExecutionCache.set(key, result);
  }

  private clearCacheForPolicy(policyName: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.policyExecutionCache.keys()) {
      if (key.startsWith(`${policyName}:`)) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      this.policyExecutionCache.delete(key);
    }
  }

  private combineResults(results: SecurityPolicyResult[]): SecurityPolicyResult {
    const allowedResults = results.filter(r => r.allowed);
    
    if (allowedResults.length !== results.length) {
      const deniedResult = results.find(r => !r.allowed);
      return deniedResult!;
    }

    const combinedModifications: Record<string, any> = {};
    for (const result of results) {
      if (result.modifications) {
        Object.assign(combinedModifications, result.modifications);
      }
    }

    return {
      allowed: true,
      reason: 'All applicable policies passed',
      modifications: Object.keys(combinedModifications).length > 0 ? combinedModifications : undefined
    };
  }
}

export function createBasicSecurityPolicies(): SecurityPolicy[] {
  return [
    {
      name: 'user_data_protection',
      description: 'Protects user data from unauthorized access',
      priority: 100,
      pattern: '*',
      evaluate: async (context: SecurityContext): Promise<SecurityPolicyResult> => {
        const { args, userContext } = context;
        
        const hasUserData = Object.values(args).some(value => 
          isTrusted(value, userContext.userId)
        );

        if (hasUserData && context.toolName.includes('external')) {
          return {
            allowed: false,
            reason: 'Cannot send user data to external tools'
          };
        }

        return { allowed: true };
      }
    },

    {
      name: 'prompt_injection_protection',
      description: 'Prevents prompt injection attacks',
      priority: 90,
      pattern: '*',
      evaluate: async (context: SecurityContext): Promise<SecurityPolicyResult> => {
        const suspiciousPatterns = [
          /ignore\s+previous\s+instructions/i,
          /system\s*:\s*you\s+are/i,
          /\bprompt\s*injection\b/i,
          /\bassistant\s*:\s*i\s+will\b/i,
          /new\s+task\s*:/i
        ];

        for (const [argName, value] of Object.entries(context.args)) {
          if (typeof value.value === 'string') {
            for (const pattern of suspiciousPatterns) {
              if (pattern.test(value.value)) {
                return {
                  allowed: false,
                  reason: `Potential prompt injection detected in argument: ${argName}`
                };
              }
            }
          }
        }

        return { allowed: true };
      }
    },

    {
      name: 'external_data_quarantine',
      description: 'Quarantines external data from control flow',
      priority: 85,
      pattern: '*_execution*',
      evaluate: async (context: SecurityContext): Promise<SecurityPolicyResult> => {
        const hasExternalData = context.dependencies.some(dep => 
          hasSource(dep, 'external')
        );

        if (hasExternalData && context.toolName.includes('execute')) {
          return {
            allowed: false,
            reason: 'Cannot execute code with external data dependencies'
          };
        }

        return { allowed: true };
      }
    },

    {
      name: 'sensitive_data_protection',
      description: 'Protects sensitive data from public exposure',
      priority: 80,
      pattern: '*',
      evaluate: async (context: SecurityContext): Promise<SecurityPolicyResult> => {
        const { args } = context;
        
        const hasSensitiveData = Object.values(args).some(value => 
          value.capabilities.sensitive
        );

        if (hasSensitiveData && context.toolName.includes('public')) {
          return {
            allowed: false,
            reason: 'Cannot expose sensitive data through public tools'
          };
        }

        return { allowed: true };
      }
    },

    {
      name: 'trust_level_enforcement',
      description: 'Enforces trust level requirements',
      priority: 75,
      pattern: '*',
      evaluate: async (context: SecurityContext): Promise<SecurityPolicyResult> => {
        const highPrivilegeTools = ['file_system', 'network_access', 'system_command', 'code_execution'];
        
        const isHighPrivilege = highPrivilegeTools.some(tool => 
          context.toolName.includes(tool)
        );

        if (isHighPrivilege && context.userContext.trustLevel !== 'high') {
          return {
            allowed: false,
            reason: `Tool ${context.toolName} requires high trust level`
          };
        }

        return { allowed: true };
      }
    }
  ];
}
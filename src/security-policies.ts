import { SecurityPolicy, SecurityContext, SecurityResult } from './types';

export const DefaultSecurityPolicies: SecurityPolicy[] = [
  {
    name: 'user_data_protection',
    description: 'Ensures user data is not leaked to unauthorized recipients',
    evaluate: async (context: SecurityContext): Promise<SecurityResult> => {
      const { args, userContext } = context;
      
      if (args.recipient && typeof args.recipient === 'string') {
        if (args.recipient.includes('@') && !userContext.permissions.includes('external_communication')) {
          return {
            allowed: false,
            reason: 'User lacks permission for external communication'
          };
        }
      }

      return { allowed: true };
    }
  },

  {
    name: 'data_flow_integrity',
    description: 'Ensures data flows only to authorized readers',
    evaluate: async (context: SecurityContext): Promise<SecurityResult> => {
      const { dataProvenance, args } = context;
      
      if (dataProvenance.capabilities.sensitive && args.public === true) {
        return {
          allowed: false,
          reason: 'Cannot make sensitive data public'
        };
      }

      return { allowed: true };
    }
  },

  {
    name: 'tool_access_control',
    description: 'Controls access to high-privilege tools',
    evaluate: async (context: SecurityContext): Promise<SecurityResult> => {
      const { toolName, userContext } = context;
      
      const highPrivilegeTools = ['file_system', 'network_access', 'system_command'];
      
      if (highPrivilegeTools.includes(toolName) && userContext.trustLevel !== 'high') {
        return {
          allowed: false,
          reason: `Tool ${toolName} requires high trust level`
        };
      }

      return { allowed: true };
    }
  },

  {
    name: 'external_data_quarantine',
    description: 'Quarantines external data from control flow',
    evaluate: async (context: SecurityContext): Promise<SecurityResult> => {
      const { dataProvenance, toolName } = context;
      
      if (dataProvenance.source === 'external' && toolName === 'code_execution') {
        return {
          allowed: false,
          reason: 'Cannot execute code with external data input'
        };
      }

      return { allowed: true };
    }
  },

  {
    name: 'prompt_injection_protection',
    description: 'Protects against prompt injection attacks',
    evaluate: async (context: SecurityContext): Promise<SecurityResult> => {
      const { args } = context;
      
      const suspiciousPatterns = [
        /ignore\s+previous\s+instructions/i,
        /system\s*:\s*you\s+are/i,
        /\bprompt\s*injection\b/i,
        /\bassistant\s*:\s*i\s+will\b/i
      ];

      for (const [key, value] of Object.entries(args)) {
        if (typeof value === 'string') {
          for (const pattern of suspiciousPatterns) {
            if (pattern.test(value)) {
              return {
                allowed: false,
                reason: `Potential prompt injection detected in ${key}`
              };
            }
          }
        }
      }

      return { allowed: true };
    }
  },

  {
    name: 'rate_limiting',
    description: 'Prevents abuse through rate limiting',
    evaluate: async (context: SecurityContext): Promise<SecurityResult> => {
      const { userContext } = context;
      
      if (userContext.trustLevel === 'low') {
        return {
          allowed: true,
          modifications: {
            maxExecutions: 5,
            timeWindow: 60000
          }
        };
      }

      return { allowed: true };
    }
  }
];

export function createCustomSecurityPolicy(
  name: string,
  description: string,
  evaluator: (context: SecurityContext) => Promise<SecurityResult>
): SecurityPolicy {
  return {
    name,
    description,
    evaluate: evaluator
  };
}
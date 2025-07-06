import { IntentRouterConfig, UserContext } from './types';
import { KernelTool } from '@unternet/kernel';
import { DefaultSecurityPolicies } from './security-policies';
import { DEFAULT_CORS_CONFIG } from './cors-config';

export function createDefaultConfig(
  executorApiKey: string,
  executorEndpoint: string = 'https://api.openai.com',
  executorModel: string = 'gpt-4o',
  plannerHost: string = 'http://localhost',
  plannerPort: number = 11434
): IntentRouterConfig {
  return {
    plannerModel: {
      model: 'qwen2.5:4b',
      host: plannerHost,
      port: plannerPort,
      cors: DEFAULT_CORS_CONFIG
    },
    executorModel: {
      endpoint: executorEndpoint,
      apiKey: executorApiKey,
      model: executorModel
    },
    tools: [],
    maxExecutionSteps: 10,
    securityPolicies: DefaultSecurityPolicies
  };
}

export function createUserContext(
  userId?: string,
  permissions: string[] = [],
  trustLevel: 'low' | 'medium' | 'high' = 'medium'
): UserContext {
  return {
    userId,
    permissions,
    trustLevel,
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
}

export function createBasicTools(): KernelTool[] {
  return [
    {
      type: 'function',
      name: 'web_search',
      description: 'Search the web for information',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query'
          }
        },
        required: ['query']
      },
      execute: async (args: { query: string }) => {
        return {
          message: `Simulated web search for: ${args.query}`,
          results: ['Mock result 1', 'Mock result 2']
        };
      }
    },
    {
      type: 'function',
      name: 'send_email',
      description: 'Send an email to a recipient',
      parameters: {
        type: 'object',
        properties: {
          recipient: {
            type: 'string',
            description: 'Email address of recipient'
          },
          subject: {
            type: 'string',
            description: 'Email subject'
          },
          body: {
            type: 'string',
            description: 'Email body'
          }
        },
        required: ['recipient', 'subject', 'body']
      },
      execute: async (args: { recipient: string; subject: string; body: string }) => {
        return {
          message: `Email sent to ${args.recipient}`,
          success: true
        };
      }
    },
    {
      type: 'function',
      name: 'file_read',
      description: 'Read a file from the filesystem',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'File path to read'
          }
        },
        required: ['path']
      },
      execute: async (args: { path: string }) => {
        return {
          message: `File read from ${args.path}`,
          content: 'Mock file content'
        };
      }
    },
    {
      type: 'function',
      name: 'calculate',
      description: 'Perform mathematical calculations',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'Mathematical expression to evaluate'
          }
        },
        required: ['expression']
      },
      execute: async (args: { expression: string }) => {
        try {
          const result = Function(`"use strict"; return (${args.expression})`)();
          return {
            expression: args.expression,
            result: result,
            success: true
          };
        } catch (error) {
          return {
            expression: args.expression,
            error: error instanceof Error ? error.message : String(error),
            success: false
          };
        }
      }
    }
  ];
}

export function validateConfig(config: IntentRouterConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.plannerModel.model) {
    errors.push('Planner model is required');
  }

  if (!config.executorModel.apiKey) {
    errors.push('Executor API key is required');
  }

  if (!config.executorModel.endpoint) {
    errors.push('Executor endpoint is required');
  }

  if (!config.executorModel.model) {
    errors.push('Executor model is required');
  }

  if (!Array.isArray(config.tools)) {
    errors.push('Tools must be an array');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function mergeConfigs(base: IntentRouterConfig, override: Partial<IntentRouterConfig>): IntentRouterConfig {
  return {
    ...base,
    ...override,
    plannerModel: {
      ...base.plannerModel,
      ...override.plannerModel
    },
    executorModel: {
      ...base.executorModel,
      ...override.executorModel
    },
    tools: override.tools || base.tools,
    securityPolicies: override.securityPolicies || base.securityPolicies
  };
}

export function createOpenAIConfig(apiKey: string, model: string = 'gpt-4o'): IntentRouterConfig {
  return createDefaultConfig(apiKey, 'https://api.openai.com', model);
}

export function createAnthropicConfig(apiKey: string, model: string = 'claude-3-5-sonnet-20241022'): IntentRouterConfig {
  return createDefaultConfig(apiKey, 'https://api.anthropic.com', model);
}

export function createOllamaConfig(apiKey: string, model: string = 'llama3.2', host: string = 'http://localhost:11434'): IntentRouterConfig {
  return createDefaultConfig(apiKey, host, model);
}

export function createCustomEndpointConfig(
  apiKey: string,
  endpoint: string,
  model: string,
  plannerHost?: string,
  plannerPort?: number
): IntentRouterConfig {
  return createDefaultConfig(apiKey, endpoint, model, plannerHost, plannerPort);
}
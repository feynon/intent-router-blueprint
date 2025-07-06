export { IntentRouter } from './intent-router';
export { IntentPlanner } from './planner';
export { IntentExecutor } from './executor';
export { DefaultSecurityPolicies, createCustomSecurityPolicy } from './security-policies';
export { 
  createDefaultConfig, 
  createUserContext, 
  createBasicTools, 
  validateConfig, 
  mergeConfigs,
  createOpenAIConfig,
  createAnthropicConfig,
  createOllamaConfig,
  createCustomEndpointConfig
} from './utils';

// Export CORS configuration utilities
export {
  DEFAULT_CORS_CONFIG,
  PERMISSIVE_CORS_CONFIG,
  SECURE_CORS_CONFIG,
  createCorsConfig,
  generateOllamaEnvironmentConfig,
  generateOllamaStartupScript,
  validateCorsConfig
} from './cors-config';

// Export browser configuration utilities
export {
  createBrowserOllamaConfig,
  createBrowserIntentRouterConfig,
  getBrowserOllamaEndpoint,
  generateBrowserSetupInstructions,
  createProductionBrowserConfig,
  createDevelopmentBrowserConfig
} from './browser-config';

// Export CaMeL system components
export * from './camel';

export type {
  IntentRouterConfig,
  SecurityPolicy as MainSecurityPolicy,
  SecurityContext as MainSecurityContext,
  SecurityResult as MainSecurityResult,
  DataProvenance,
  DataCapabilities,
  IntentRouterEvents,
  OllamaCorsConfig
} from './types';

export type {
  BrowserOllamaConfig
} from './browser-config';

export type {
  ExecutionPlan,
  ExecutionResult,
  UserContext,
  SecurityPolicy,
  SecurityContext,
  SecurityPolicyResult as SecurityResult
} from './camel/types';

export { ExecutionPlanSchema } from './types';
import { 
  IntentRouter, 
  createOpenAIConfig, 
  createAnthropicConfig,
  createBasicTools,
  IntentRouterConfig
} from 'intent-router-blueprint';

let router: IntentRouter | null = null;

export function getIntentRouter(): IntentRouter {
  if (!router) {
    let config: IntentRouterConfig;
    
    // Try different API providers based on available environment variables
    if (process.env.OPENAI_API_KEY) {
      config = createOpenAIConfig(process.env.OPENAI_API_KEY, 'gpt-4o-mini');
    } else if (process.env.ANTHROPIC_API_KEY) {
      config = createAnthropicConfig(process.env.ANTHROPIC_API_KEY, 'claude-3-haiku-20240307');
    } else {
      throw new Error('No API key found. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.');
    }
    
    // Add basic tools for demonstration
    config.tools = createBasicTools();
    
    router = new IntentRouter(config);
  }
  
  return router;
}

export function resetRouter(): void {
  router = null;
}
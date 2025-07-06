# Intent Router Blueprint

⚠️ **DISCLAIMER**: This is experimental research software in active development - may not function correctly and is not suitable for production use.

A dual-LLM intent routing system for secure agent orchestration.

## Overview

This package extends the **Unternet Kernel** to implement a secure intent routing system that separates planning from execution to prevent prompt injection attacks. It integrates the **CAMEL security model** from the DeepMind paper ["Defeating Prompt Injections by Design"](https://arxiv.org/abs/2503.18813) into the Unternet framework, providing a production-ready dual-LLM architecture for secure agent orchestration.

### Key Principles

- **Coordination must be separate from execution**
- **Local privacy**: User data stays local during planning
- **Structured execution**: Only sanitized plans reach the executor
- **Capability-based security**: Fine-grained control over data flows

## Architecture

- **Planner LLM**: Runs locally via Ollama (qwen2.5:4b) - generates secure execution plans
- **Executor LLM**: Runs remotely via OpenAI-compatible API - executes structured plans without raw user input

## Installation

```bash
npm install intent-router-blueprint
```

## Prerequisites

1. Install [Ollama](https://ollama.ai)
2. Pull the model: `ollama pull qwen2.5:4b`
3. Get an API key from any OpenAI-compatible provider:
   - **OpenAI**: [https://platform.openai.com/](https://platform.openai.com/)
   - **Anthropic**: [https://console.anthropic.com/](https://console.anthropic.com/)
   - **Other providers**: OpenRouter, Together AI, etc.

## Quick Start

```typescript
import { 
  IntentRouter, 
  createOpenAIConfig, 
  createUserContext, 
  createBasicTools 
} from 'intent-router-blueprint';

// Configure the router for OpenAI
const config = createOpenAIConfig('your-openai-api-key');
config.tools = createBasicTools();

// Create user context
const userContext = createUserContext('user123', ['web_search', 'send_email'], 'medium');

// Initialize and use
const router = new IntentRouter(config);
const result = await router.route(
  "Search for AI news and email a summary to john@example.com",
  userContext
);
```

## Provider Configuration

The system supports multiple OpenAI-compatible providers. Choose the configuration that matches your provider:

### OpenAI
```typescript
import { createOpenAIConfig } from 'intent-router-blueprint';

const config = createOpenAIConfig('your-openai-api-key', 'gpt-4o');
```

### Anthropic
```typescript
import { createAnthropicConfig } from 'intent-router-blueprint';

const config = createAnthropicConfig('your-anthropic-api-key', 'claude-3-5-sonnet-20241022');
```

### Custom Endpoint
```typescript
import { createCustomEndpointConfig } from 'intent-router-blueprint';

const config = createCustomEndpointConfig(
  'your-api-key',
  'https://api.your-provider.com/v1',
  'your-model-name'
);
```

### Manual Configuration
```typescript
import { createDefaultConfig } from 'intent-router-blueprint';

const config = createDefaultConfig(
  'your-api-key',           // API key
  'https://api.provider.com', // Endpoint
  'model-name',             // Model
  'http://localhost',       // Planner host (optional)
  11434                     // Planner port (optional)
);
```

## Next.js Integration

### 1. Setup Router

```typescript
// lib/intent-router.ts
import { IntentRouter, createOpenAIConfig, createBasicTools } from 'intent-router-blueprint';

let router: IntentRouter;

export function getIntentRouter(): IntentRouter {
  if (!router) {
    const config = createOpenAIConfig(process.env.OPENAI_API_KEY!);
    config.tools = createBasicTools();
    router = new IntentRouter(config);
  }
  return router;
}
```

### 2. API Route

```typescript
// pages/api/intent-route.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getIntentRouter } from '../../lib/intent-router';
import { createUserContext } from 'intent-router-blueprint';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { intent, userId, permissions = [] } = req.body;

  try {
    const router = getIntentRouter();
    const userContext = createUserContext(userId, permissions, 'medium');
    const result = await router.route(intent, userContext);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}
```

### 3. React Hook

```typescript
// hooks/useIntentRouter.ts
import { useState } from 'react';
import { ExecutionResult } from 'intent-router-blueprint';

export function useIntentRouter() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const route = async (intent: string, userId?: string, permissions?: string[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/intent-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent, userId, permissions }),
      });

      if (!response.ok) throw new Error('Failed to route intent');
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { route, loading, result, error };
}
```

### 4. UI Component

```typescript
// components/IntentInterface.tsx
import { useState } from 'react';
import { useIntentRouter } from '../hooks/useIntentRouter';

export default function IntentInterface() {
  const [intent, setIntent] = useState('');
  const { route, loading, result, error } = useIntentRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await route(intent, 'user123', ['web_search', 'send_email']);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Intent Router</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="What would you like to do?"
          className="w-full p-3 border rounded-md"
          rows={3}
        />
        
        <button
          type="submit"
          disabled={loading || !intent.trim()}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Route Intent'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="font-semibold mb-2">Result:</h3>
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
```

## Security Features

### Built-in Security Policies

- **User Data Protection**: Prevents unauthorized data disclosure
- **Tool Access Control**: Restricts high-privilege tool access  
- **Prompt Injection Protection**: Detects and blocks injection attempts
- **External Data Quarantine**: Isolates external data from control flow

### Custom Security Policies

```typescript
import { createCustomSecurityPolicy } from 'intent-router-blueprint';

const customPolicy = createCustomSecurityPolicy(
  'company_data_protection',
  'Prevents company data from being sent externally',
  async (context) => {
    if (context.args.recipient?.includes('@external.com')) {
      return {
        allowed: false,
        reason: 'Company data cannot be sent to external domains'
      };
    }
    return { allowed: true };
  }
);

config.securityPolicies = [customPolicy, ...config.securityPolicies];
```

## Custom Tools

```typescript
import { KernelTool } from '@unternet/kernel';

const weatherTool: KernelTool = {
  type: 'function',
  name: 'weather_api',
  description: 'Get weather information',
  parameters: {
    type: 'object',
    properties: {
      location: { type: 'string' },
      units: { type: 'string', enum: ['celsius', 'fahrenheit'] }
    },
    required: ['location']
  },
  execute: async (args) => {
    // Your weather API integration
    return { temperature: 22, description: 'Sunny' };
  }
};

config.tools.push(weatherTool);
```

## Environment Variables

Configure your environment variables based on your chosen provider:

### OpenAI
```bash
# .env.local
OPENAI_API_KEY=your_openai_api_key_here
OLLAMA_HOST=http://localhost:11434  # Optional
```

### Anthropic
```bash
# .env.local
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OLLAMA_HOST=http://localhost:11434  # Optional
```

### Custom Provider
```bash
# .env.local
CUSTOM_API_KEY=your_custom_api_key_here
CUSTOM_ENDPOINT=https://api.your-provider.com/v1
CUSTOM_MODEL=your-model-name
OLLAMA_HOST=http://localhost:11434  # Optional
```

## API Reference

### IntentRouter

Main class for routing user intents through the dual-LLM system.

```typescript
class IntentRouter {
  constructor(config: IntentRouterConfig)
  
  async route(intent: string, userContext: UserContext): Promise<ExecutionResult>
  async planOnly(intent: string, userContext: UserContext): Promise<ExecutionPlan>
  async executeExistingPlan(plan: ExecutionPlan, userContext: UserContext): Promise<ExecutionResult>
}
```

### Configuration

```typescript
interface IntentRouterConfig {
  plannerModel: { model: string; host?: string; port?: number };
  executorModel: { endpoint: string; apiKey: string; model: string };
  tools: KernelTool[];
  securityPolicies?: SecurityPolicy[];
}
```

## Interactive Demo

Experience the Intent Router Blueprint in action with our comprehensive Next.js demo:

```bash
cd examples/nextjs-demo
npm install
npm run dev
```

The demo showcases:
- ** Interactive Intent Interface**: Natural language input with real-time processing
- ** Security Visualization**: See execution plans and security assessments
- ** System Monitoring**: Real-time status of planner and executor models
- ** Tool Integration**: Explore available tools and their capabilities
- ** Configuration Options**: Adjust user permissions and trust levels

### Demo Features
- Pre-built examples for common use cases
- Plan-only mode to inspect execution plans without running them
- Security policy demonstrations
- Multi-provider support (OpenAI, Anthropic, custom endpoints)
- Real-time error handling and security violation reporting

Visit [examples/nextjs-demo](./examples/nextjs-demo) for detailed setup instructions.

## Development

```bash
npm install
npm run build
npm run test
npm run typecheck
```

## License

This project is licensed under the MIT License – © Ankesh Bharti

# Intent Router Blueprint

⚠️ **DISCLAIMER**: This is experimental research software in active development - may not function correctly and is not suitable for production use.

A hybrid LLM intent routing system for secure agent orchestration that operates seamlessly.

## Table of Contents

- [Intent Router Blueprint](#intent-router-blueprint)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Architecture](#architecture)
  - [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Quick Start](#quick-start)
  - [Provider Configuration](#provider-configuration)
    - [OpenAI](#openai)
    - [Anthropic](#anthropic)
    - [Custom Endpoint](#custom-endpoint)
    - [Manual Configuration](#manual-configuration)
  - [Next.js Integration](#nextjs-integration)
    - [1. Setup Router](#1-setup-router)
    - [2. API Route](#2-api-route)
    - [3. React Hook](#3-react-hook)
    - [4. UI Component](#4-ui-component)
  - [Security Features](#security-features)
    - [Built-in Security Policies](#built-in-security-policies)
    - [Custom Security Policies](#custom-security-policies)
  - [Custom Tools](#custom-tools)
  - [Environment Variables](#environment-variables)
    - [OpenAI](#openai-1)
    - [Anthropic](#anthropic-1)
    - [Custom Provider](#custom-provider)
  - [API Reference](#api-reference)
    - [IntentRouter](#intentrouter)
    - [Configuration](#configuration)
  - [Demo Applications](#demo-applications)
    - [Browser Demo (Next.js)](#browser-demo-nextjs)
    - [Node.js CLI Demo (React Ink)](#nodejs-cli-demo-react-ink)
  - [Development](#development)
  - [License](#license)

## Overview

This package extends the [Unternet Kernel](https://github.com/unternet-co/kernel) runtime to implement a secure intent routing system that separates planning from execution to prevent prompt injection attacks. It integrates the **CAMEL security model** from the Google DeepMind paper ["Defeating Prompt Injections by Design"](https://arxiv.org/abs/2503.18813), providing a dual-LLM architecture for secure agent orchestration. The design also incorporates insights from NVIDIA Research’s [“Small Language Models are the Future of Agentic AI”](https://arxiv.org/abs/2506.02153), adopting a heterogeneous compute strategy that leverages small and large LLMs collaboratively for agentic intelligence. The system is fully [WinterTC](https://wintertc.org/) compliant, ensuring unified operation across both browser and Node.js environments.
z

## Architecture

- **Planner LLM**: Runs locally via Ollama (qwen2.5:4b) - generates secure execution plans
- **Executor LLM**: Runs remotely via OpenAI-compatible API - executes structured plans without raw user input
- **Memory Manager**: WinterTC-compliant memory management that works in both environments
- **Cross-platform APIs**: Uses globalThis for timers, workers, and other environment-specific features
- **CAMEL Security Model**: Implements control and data flow security with strict data quarantine policies

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

## Demo Applications

The Intent Router Blueprint includes two comprehensive demo applications showcasing cross-platform WinterTC compliance:

### Browser Demo (Next.js)

Experience the Intent Router in a browser environment with our interactive Next.js demo:

```bash
cd examples/nextjs-demo
npm install
npm run dev
```

**Features:**
- Interactive web interface with real-time processing
- Security visualization and execution plan inspection
- System monitoring dashboard
- Multi-provider support (OpenAI, Anthropic, custom endpoints)
- Plan-only mode for safe execution plan review

For detailed setup instructions and features, see [examples/nextjs-demo/README.md](./examples/nextjs-demo/README.md).

### Node.js CLI Demo (React Ink)

Test the Intent Router in a Node.js environment with our React Ink CLI application:

```bash
cd examples/cli-demo
npm install
npm run build
npm start
```

**Features:**
- Interactive command-line interface
- Real-time WinterTC compliance monitoring
- Dual-LLM orchestration visualization
- Security policy demonstrations
- Cross-platform API status indicators

For installation, usage, and troubleshooting, see [examples/cli-demo/README.md](./examples/cli-demo/README.md).

## Development

```bash
npm install
npm run build
npm run test
npm run typecheck
```

## License

This project is licensed under the MIT License – © Ankesh Bharti

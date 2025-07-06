import { IntentRouterConfig, OllamaCorsConfig } from './types';
import { createDefaultConfig } from './utils';
import { DEFAULT_CORS_CONFIG, createCorsConfig } from './cors-config';

export interface BrowserOllamaConfig {
  host: string;
  port: number;
  model: string;
  cors: OllamaCorsConfig;
  timeout: number;
  retries: number;
}

export function createBrowserOllamaConfig(
  customConfig: Partial<BrowserOllamaConfig> = {}
): BrowserOllamaConfig {
  return {
    host: 'http://localhost',
    port: 11434,
    model: 'qwen2.5:4b',
    cors: DEFAULT_CORS_CONFIG,
    timeout: 30000,
    retries: 3,
    ...customConfig
  };
}

export function createBrowserIntentRouterConfig(
  executorApiKey: string,
  browserConfig: Partial<BrowserOllamaConfig> = {},
  executorEndpoint: string = 'https://api.openai.com',
  executorModel: string = 'gpt-4o'
): IntentRouterConfig {
  const ollamaConfig = createBrowserOllamaConfig(browserConfig);
  
  return {
    ...createDefaultConfig(executorApiKey, executorEndpoint, executorModel, ollamaConfig.host, ollamaConfig.port),
    plannerModel: {
      model: ollamaConfig.model,
      host: ollamaConfig.host,
      port: ollamaConfig.port,
      cors: ollamaConfig.cors
    }
  };
}

export function getBrowserOllamaEndpoint(config: BrowserOllamaConfig): string {
  return `${config.host}:${config.port}`;
}

export function generateBrowserSetupInstructions(config: BrowserOllamaConfig): string {
  const envVars = Object.entries({
    OLLAMA_ORIGINS: Array.isArray(config.cors.origin) ? config.cors.origin.join(',') : config.cors.origin,
    OLLAMA_HOST: '0.0.0.0',
    OLLAMA_CORS_ALLOW_ORIGIN: Array.isArray(config.cors.origin) ? config.cors.origin.join(',') : config.cors.origin,
    OLLAMA_CORS_ALLOW_METHODS: config.cors.methods.join(','),
    OLLAMA_CORS_ALLOW_HEADERS: config.cors.headers.join(','),
    OLLAMA_CORS_ALLOW_CREDENTIALS: config.cors.credentials.toString()
  });

  return `# Ollama Browser Setup Instructions

## 1. Install Ollama (if not already installed)

\`\`\`bash
curl -fsSL https://ollama.ai/install.sh | sh
\`\`\`

## 2. Set Environment Variables

Add these environment variables to your system:

${envVars.map(([key, value]) => `export ${key}="${value}"`).join('\n')}

## 3. Start Ollama Server

Run the following command to start Ollama with CORS enabled:

\`\`\`bash
ollama serve
\`\`\`

## 4. Pull Required Model

Make sure you have the required model:

\`\`\`bash
ollama pull ${config.model}
\`\`\`

## 5. Verify Setup

Run the verification script to check your setup:

\`\`\`bash
./scripts/verify-ollama-setup.sh
\`\`\`

## 6. Test CORS Configuration

You can test the CORS configuration by making a request from your browser:

\`\`\`javascript
fetch('${getBrowserOllamaEndpoint(config)}/api/tags', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
})
.then(response => response.json())
.then(data => console.log('CORS working:', data))
.catch(error => console.error('CORS error:', error));
\`\`\`

## 7. Common Issues

- **Ollama not installed**: Run \`curl -fsSL https://ollama.ai/install.sh | sh\`
- **CORS blocked**: Make sure OLLAMA_ORIGINS includes your domain
- **Connection refused**: Check if Ollama is running on the correct port
- **Model not found**: Run \`ollama pull ${config.model}\` first

## 8. Browser Configuration

In your browser application, use this configuration:

\`\`\`javascript
const config = {
  host: '${config.host}',
  port: ${config.port},
  model: '${config.model}',
  timeout: ${config.timeout},
  retries: ${config.retries}
};
\`\`\`

## 9. Quick Start Scripts

Use the provided scripts for easy setup:

\`\`\`bash
# Setup models and verify installation
./scripts/setup-ollama-models.sh

# Start Ollama with CORS configuration
./scripts/start-ollama-cors.sh

# Verify everything is working
./scripts/verify-ollama-setup.sh
\`\`\`
`;
}

export function createProductionBrowserConfig(allowedOrigins: string[]): BrowserOllamaConfig {
  return createBrowserOllamaConfig({
    cors: createCorsConfig({
      origin: allowedOrigins,
      credentials: true,
      methods: ['POST', 'GET', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization']
    })
  });
}

export function createDevelopmentBrowserConfig(): BrowserOllamaConfig {
  return createBrowserOllamaConfig({
    cors: createCorsConfig({
      origin: ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:3000', 'http://127.0.0.1:8080'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
    })
  });
}
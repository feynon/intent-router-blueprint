import { OllamaCorsConfig } from './types';

export const DEFAULT_CORS_CONFIG: OllamaCorsConfig = {
  enabled: true,
  origin: ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:3000', 'http://127.0.0.1:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  headers: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true
};

export const PERMISSIVE_CORS_CONFIG: OllamaCorsConfig = {
  enabled: true,
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  headers: ['*'],
  credentials: false
};

export const SECURE_CORS_CONFIG: OllamaCorsConfig = {
  enabled: true,
  origin: ['https://yourdomain.com'],
  methods: ['POST'],
  headers: ['Content-Type', 'Authorization'],
  credentials: true
};

export function createCorsConfig(customConfig: Partial<OllamaCorsConfig> = {}): OllamaCorsConfig {
  return {
    ...DEFAULT_CORS_CONFIG,
    ...customConfig
  };
}

export function generateOllamaEnvironmentConfig(corsConfig: OllamaCorsConfig): Record<string, string> {
  if (!corsConfig.enabled) {
    return {};
  }

  const origins = Array.isArray(corsConfig.origin) 
    ? corsConfig.origin.join(',') 
    : corsConfig.origin;

  return {
    OLLAMA_ORIGINS: origins,
    OLLAMA_HOST: '0.0.0.0',
    OLLAMA_CORS_ALLOW_ORIGIN: origins,
    OLLAMA_CORS_ALLOW_METHODS: corsConfig.methods.join(','),
    OLLAMA_CORS_ALLOW_HEADERS: corsConfig.headers.join(','),
    OLLAMA_CORS_ALLOW_CREDENTIALS: corsConfig.credentials.toString()
  };
}

export function generateOllamaStartupScript(corsConfig: OllamaCorsConfig): string {
  const envVars = generateOllamaEnvironmentConfig(corsConfig);

  return `#!/bin/bash
# Ollama CORS Configuration Script
# Generated automatically for intent-router-blueprint

set -e

echo "🚀 Starting Ollama with CORS configuration for browser compatibility..."

# Set environment variables for CORS
${Object.entries(envVars)
  .map(([key, value]) => `export ${key}="${value}"`)
  .join('\n')}

echo "✅ Environment variables set:"
${Object.entries(envVars)
  .map(([key, value]) => `echo "   ${key}: ${value}"`)
  .join('\n')}

# Check if Ollama is already running
if pgrep -f "ollama serve" > /dev/null; then
    echo "⚠️  Ollama is already running. Stopping it first..."
    pkill -f "ollama serve" || true
    sleep 2
fi

# Start Ollama
echo "🏃 Starting Ollama server..."
ollama serve &

# Wait a moment for the server to start
sleep 3

# Check if the server is running
if pgrep -f "ollama serve" > /dev/null; then
    echo "✅ Ollama server is running with CORS enabled!"
    echo "🌐 Server accessible at: http://localhost:11434"
    echo "🔗 Test endpoint: http://localhost:11434/api/tags"
    echo ""
    echo "📋 To test CORS from browser console:"
    echo "   fetch('http://localhost:11434/api/tags').then(r => r.json()).then(console.log)"
    echo ""
    echo "🛑 To stop the server, run: pkill -f 'ollama serve'"
else
    echo "❌ Failed to start Ollama server"
    exit 1
fi

# Keep the script running to show logs
echo "📊 Ollama server logs (Ctrl+C to stop):"
wait
`;
}


export function validateCorsConfig(config: OllamaCorsConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.enabled) {
    if (!config.origin || (Array.isArray(config.origin) && config.origin.length === 0)) {
      errors.push('Origin must be specified when CORS is enabled');
    }

    if (!config.methods || config.methods.length === 0) {
      errors.push('HTTP methods must be specified when CORS is enabled');
    }

    if (!config.headers || config.headers.length === 0) {
      errors.push('Headers must be specified when CORS is enabled');
    }

    if (config.origin === '*' && config.credentials) {
      errors.push('Cannot use wildcard origin with credentials enabled');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
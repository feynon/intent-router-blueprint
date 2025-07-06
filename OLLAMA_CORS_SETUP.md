# Ollama CORS Setup for Browser Compatibility

This guide explains how to configure Ollama to work with browser-based applications by enabling CORS (Cross-Origin Resource Sharing). The intent-router-blueprint uses Ollama for local LLM processing and requires proper CORS configuration for browser compatibility.

## Prerequisites

- **Operating System**: macOS, Linux, or Windows with WSL
- **Node.js**: Version 18 or higher (for the intent router)
- **Internet Connection**: Required for downloading Ollama and models
- **Available Ports**: 11434 (default Ollama port) should be free

## 🚀 Quick Start

### 🎯 Automatic Setup (Recommended)

The fastest way to get started:

```bash
# 1. Setup models and verify Ollama installation
./scripts/setup-ollama-models.sh

# 2. Start Ollama with CORS enabled
./scripts/start-ollama-cors.sh

# 3. Verify everything is working (in a new terminal)
./scripts/verify-ollama-setup.sh
```

### 🔧 Manual Setup

If you prefer to set up manually:

```bash
# 1. Install Ollama (if not already installed)
curl -fsSL https://ollama.ai/install.sh | sh

# 2. Pull required models
ollama pull qwen2.5:4b

# 3. Set CORS environment variables
export OLLAMA_ORIGINS="http://localhost:3000,http://localhost:8080,http://127.0.0.1:3000,http://127.0.0.1:8080"
export OLLAMA_HOST="0.0.0.0"
export OLLAMA_CORS_ALLOW_ORIGIN="http://localhost:3000,http://localhost:8080,http://127.0.0.1:3000,http://127.0.0.1:8080"
export OLLAMA_CORS_ALLOW_METHODS="GET,POST,PUT,DELETE,OPTIONS"
export OLLAMA_CORS_ALLOW_HEADERS="Content-Type,Authorization,X-Requested-With,Accept,Origin"
export OLLAMA_CORS_ALLOW_CREDENTIALS="true"

# 4. Start Ollama server
ollama serve
```

### ✅ Verification

After setup, verify everything works:

```bash
# Test server connectivity
curl http://localhost:11434/api/tags

# Test model functionality
ollama run qwen2.5:4b "Hello world"

# Or run the comprehensive verification
./scripts/verify-ollama-setup.sh
```

## 📋 Detailed Configuration

### 📦 Installing Ollama

#### Linux/macOS (Recommended)
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

#### macOS with Homebrew
```bash
brew install ollama
```

#### Manual Download
Visit [ollama.ai](https://ollama.ai) and download the appropriate installer for your platform.

### 🌐 CORS Environment Variables

These environment variables configure CORS for browser compatibility:

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| `OLLAMA_ORIGINS` | Allowed origins for CORS | `http://localhost:3000,http://localhost:8080` |
| `OLLAMA_HOST` | Host binding | `0.0.0.0` (bind to all interfaces) |
| `OLLAMA_CORS_ALLOW_ORIGIN` | Explicit CORS origins | Same as `OLLAMA_ORIGINS` |
| `OLLAMA_CORS_ALLOW_METHODS` | Allowed HTTP methods | `GET,POST,PUT,DELETE,OPTIONS` |
| `OLLAMA_CORS_ALLOW_HEADERS` | Allowed headers | `Content-Type,Authorization,X-Requested-With,Accept,Origin` |
| `OLLAMA_CORS_ALLOW_CREDENTIALS` | Allow credentials | `true` |

#### Development Configuration
```bash
export OLLAMA_ORIGINS="http://localhost:3000,http://localhost:8080,http://127.0.0.1:3000,http://127.0.0.1:8080"
export OLLAMA_HOST="0.0.0.0"
export OLLAMA_CORS_ALLOW_ORIGIN="$OLLAMA_ORIGINS"
export OLLAMA_CORS_ALLOW_METHODS="GET,POST,PUT,DELETE,OPTIONS"
export OLLAMA_CORS_ALLOW_HEADERS="Content-Type,Authorization,X-Requested-With,Accept,Origin"
export OLLAMA_CORS_ALLOW_CREDENTIALS="true"
```

#### Production Configuration
```bash
export OLLAMA_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
export OLLAMA_HOST="0.0.0.0"
export OLLAMA_CORS_ALLOW_ORIGIN="$OLLAMA_ORIGINS"
export OLLAMA_CORS_ALLOW_METHODS="POST,OPTIONS"
export OLLAMA_CORS_ALLOW_HEADERS="Content-Type,Authorization"
export OLLAMA_CORS_ALLOW_CREDENTIALS="true"
```

### 🤖 Model Management

#### Required Models
The intent-router-blueprint requires these models:

- **Primary**: `qwen2.5:4b` (recommended for planning)
- **Alternatives**: `gemma3:4b`

#### Pull Models
```bash
# Primary model (recommended)
ollama pull qwen2.5:4b

# Alternative models (if primary fails)
ollama pull gemma3:4b
```

#### Check Available Models
```bash
ollama list
```

### 🚀 Starting Ollama Server

```bash
# With environment variables set
ollama serve

# Or use the provided script
./scripts/start-ollama-cors.sh
```

## 🌐 Browser Integration

### 🎯 Using the Intent Router with CORS

#### Basic Setup
```javascript
import { 
  createBrowserIntentRouterConfig, 
  createDevelopmentBrowserConfig,
  IntentRouter 
} from 'intent-router-blueprint';

// Create browser-compatible configuration
const browserConfig = createDevelopmentBrowserConfig();
const routerConfig = createBrowserIntentRouterConfig(
  'your-openai-api-key', // For the executor model
  browserConfig
);

// Initialize the router
const router = new IntentRouter(routerConfig);

// Use the router in your browser application
const userContext = {
  userId: 'user123',
  permissions: ['basic_access'],
  trustLevel: 'medium'
};

const result = await router.route('Hello, world!', userContext);
console.log('Router result:', result);
```

#### Advanced Configuration
```javascript
import { 
  createBrowserOllamaConfig,
  createCorsConfig,
  createBrowserIntentRouterConfig
} from 'intent-router-blueprint';

// Custom CORS configuration
const corsConfig = createCorsConfig({
  origin: ['http://localhost:3000', 'https://your-domain.com'],
  methods: ['GET', 'POST', 'OPTIONS'],
  headers: ['Content-Type', 'Authorization'],
  credentials: true
});

// Custom browser configuration
const browserConfig = createBrowserOllamaConfig({
  host: 'http://localhost',
  port: 11434,
  model: 'qwen2.5:4b',
  cors: corsConfig,
  timeout: 60000,
  retries: 3
});

const routerConfig = createBrowserIntentRouterConfig(
  process.env.OPENAI_API_KEY,
  browserConfig
);
```

### 🧪 Testing CORS Configuration

#### Quick Browser Test
Open your browser's developer console and run:

```javascript
// Test 1: Basic connectivity
fetch('http://localhost:11434/api/tags')
  .then(response => response.json())
  .then(data => {
    console.log('✅ CORS working! Available models:', data.models.map(m => m.name));
  })
  .catch(error => {
    console.error('❌ CORS error:', error);
  });

// Test 2: Model interaction
fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'qwen2.5:4b',
    prompt: 'Say hello in one word',
    stream: false
  })
})
.then(response => response.json())
.then(data => {
  console.log('✅ Model response:', data.response);
})
.catch(error => {
  console.error('❌ Model error:', error);
});
```

#### Comprehensive Test
```javascript
// Test CORS preflight and actual request
async function testOllamaCORS() {
  try {
    // Test OPTIONS request (preflight)
    const optionsResponse = await fetch('http://localhost:11434/api/tags', {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'GET'
      }
    });
    console.log('✅ Preflight OK:', optionsResponse.status);
    
    // Test actual GET request
    const getResponse = await fetch('http://localhost:11434/api/tags');
    const data = await getResponse.json();
    console.log('✅ GET request OK:', data);
    
    return true;
  } catch (error) {
    console.error('❌ CORS test failed:', error);
    return false;
  }
}

testOllamaCORS();
```

## ⚙️ Configuration Presets

### 🔧 Development Configuration

Permissive settings for local development:

```javascript
import { createDevelopmentBrowserConfig } from 'intent-router-blueprint';

// Allows common development ports and localhost variations
const config = createDevelopmentBrowserConfig();
// Includes: http://localhost:3000, :8080, 127.0.0.1:3000, :8080
```

**Environment Variables:**
```bash
export OLLAMA_ORIGINS="http://localhost:3000,http://localhost:8080,http://127.0.0.1:3000,http://127.0.0.1:8080"
export OLLAMA_CORS_ALLOW_CREDENTIALS="true"
```

### 🔒 Production Configuration

Restrictive settings for production deployment:

```javascript
import { createProductionBrowserConfig } from 'intent-router-blueprint';

const config = createProductionBrowserConfig([
  'https://your-domain.com',
  'https://www.your-domain.com',
  'https://app.your-domain.com'
]);
```

**Environment Variables:**
```bash
export OLLAMA_ORIGINS="https://your-domain.com,https://www.your-domain.com"
export OLLAMA_CORS_ALLOW_METHODS="POST,OPTIONS"
export OLLAMA_CORS_ALLOW_HEADERS="Content-Type,Authorization"
```

### ⚙️ Custom Configuration

Create application-specific CORS settings:

```javascript
import { createCorsConfig, createBrowserOllamaConfig } from 'intent-router-blueprint';

// Custom CORS rules
const corsConfig = createCorsConfig({
  origin: ['https://your-app.com', 'https://admin.your-app.com'],
  methods: ['POST', 'GET', 'OPTIONS'],
  headers: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true
});

// Custom Ollama configuration
const ollamaConfig = createBrowserOllamaConfig({
  host: 'http://localhost',
  port: 11434,
  model: 'llama3.1:8b', // Use different model
  cors: corsConfig,
  timeout: 120000, // 2 minutes
  retries: 5
});
```

### 🌍 Multi-Environment Setup

```javascript
// config/ollama.js
const environments = {
  development: {
    origins: ['http://localhost:3000', 'http://localhost:8080'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  },
  staging: {
    origins: ['https://staging.your-app.com'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS']
  },
  production: {
    origins: ['https://your-app.com', 'https://www.your-app.com'],
    credentials: true,
    methods: ['POST', 'OPTIONS']
  }
};

const env = process.env.NODE_ENV || 'development';
const config = environments[env];

export const corsConfig = createCorsConfig(config);
```

## 🚨 Common Issues and Solutions

### 1. Ollama Not Installed

**Error**: `ollama: command not found`

**Solution**:
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Or on macOS with Homebrew
brew install ollama
```

### 2. CORS Blocked Error

**Error**: `Access to fetch at 'http://localhost:11434/api/tags' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Solution**:
- Ensure `OLLAMA_ORIGINS` includes your application's origin
- Restart Ollama after setting environment variables
- Check that the origins match exactly (including protocol and port)

### 3. Connection Refused

**Error**: `Failed to fetch` or `ERR_CONNECTION_REFUSED`

**Solution**:
- Ensure Ollama is running: `ollama serve`
- Check if the port is correct (default: 11434)
- Verify `OLLAMA_HOST` is set to `0.0.0.0`
- Check if firewall is blocking the connection

### 4. Model Not Found

**Error**: `model not found` or `model not available`

**Solution**:
- Pull the required model: `ollama pull qwen2.5:4b`
- Check available models: `ollama list`
- Verify the model name in your configuration
- Try alternative models if the primary one fails

### 5. Preflight Request Failed

**Error**: CORS preflight request fails

**Solution**:
- Ensure `OPTIONS` method is allowed
- Check that all required headers are in `OLLAMA_CORS_ALLOW_HEADERS`
- Verify `OLLAMA_CORS_ALLOW_METHODS` includes necessary methods

## 🔒 Security Considerations

### Development vs Production

**Development**: Use permissive CORS settings for easier development
```bash
export OLLAMA_ORIGINS="*"  # Allow all origins (development only)
```

**Production**: Use restrictive CORS settings
```bash
export OLLAMA_ORIGINS="https://your-domain.com,https://www.your-domain.com"
```

### Best Practices

1. **Limit Origins**: Only allow necessary origins
2. **Use HTTPS**: Always use HTTPS in production
3. **Credentials**: Only enable credentials when necessary
4. **Headers**: Limit allowed headers to required ones
5. **Methods**: Only allow necessary HTTP methods

## 🔍 Troubleshooting

### Quick Verification

Run the verification script to check your entire setup:

```bash
./scripts/verify-ollama-setup.sh
```

### Manual Checks

```bash
# Check if Ollama is running
pgrep -f "ollama serve"

# Check Ollama version
ollama --version

# List available models
ollama list

# Check if a specific model is working
ollama run qwen2.5:4b "Hello world"

# Test server connectivity
curl http://localhost:11434/api/tags
```

### Test CORS Manually

```bash
# Test preflight request
curl -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  http://localhost:11434/api/tags

# Test actual request
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"model":"qwen2.5:4b","prompt":"Hello"}' \
  http://localhost:11434/api/generate
```

### Debug Environment Variables

```bash
# Print current environment variables
env | grep OLLAMA
```

## 🔗 Framework Integration Examples

### ⚛️ React/Next.js Integration

#### Custom Hook
```javascript
// hooks/useIntentRouter.js
import { useEffect, useState, useCallback } from 'react';
import { 
  createBrowserIntentRouterConfig, 
  createDevelopmentBrowserConfig,
  IntentRouter 
} from 'intent-router-blueprint';

export function useIntentRouter() {
  const [router, setRouter] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function initializeRouter() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Test Ollama connection first
        const response = await fetch('http://localhost:11434/api/tags');
        if (!response.ok) throw new Error('Ollama server not accessible');
        
        // Create configuration
        const browserConfig = createDevelopmentBrowserConfig();
        const config = createBrowserIntentRouterConfig(
          process.env.NEXT_PUBLIC_OPENAI_API_KEY,
          browserConfig
        );
        
        // Initialize router
        const routerInstance = new IntentRouter(config);
        setRouter(routerInstance);
        setIsConnected(true);
        
      } catch (err) {
        setError(err.message);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    }

    initializeRouter();
  }, []);

  const routeIntent = useCallback(async (intent, userContext) => {
    if (!router) throw new Error('Router not initialized');
    return await router.route(intent, userContext);
  }, [router]);

  return { 
    router, 
    isConnected, 
    isLoading, 
    error, 
    routeIntent 
  };
}
```

#### Component Usage
```javascript
// components/ChatInterface.jsx
import React, { useState } from 'react';
import { useIntentRouter } from '../hooks/useIntentRouter';

export function ChatInterface() {
  const { routeIntent, isConnected, isLoading, error } = useIntentRouter();
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const userContext = {
        userId: 'user123',
        permissions: ['basic_access'],
        trustLevel: 'medium'
      };
      
      const result = await routeIntent(message, userContext);
      setResponse(JSON.stringify(result, null, 2));
    } catch (err) {
      setResponse(`Error: ${err.message}`);
    }
  };

  if (isLoading) return <div>Initializing Intent Router...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!isConnected) return <div>Ollama server not connected</div>;

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your intent..."
        />
        <button type="submit">Send</button>
      </form>
      {response && <pre>{response}</pre>}
    </div>
  );
}
```

### 🔧 Vue.js Integration

#### Composable
```javascript
// composables/useIntentRouter.js
import { ref, onMounted, computed } from 'vue';
import { 
  createBrowserIntentRouterConfig,
  createDevelopmentBrowserConfig,
  IntentRouter 
} from 'intent-router-blueprint';

export function useIntentRouter() {
  const router = ref(null);
  const isConnected = ref(false);
  const isLoading = ref(true);
  const error = ref(null);

  const isReady = computed(() => {
    return !isLoading.value && isConnected.value && router.value;
  });

  onMounted(async () => {
    try {
      isLoading.value = true;
      error.value = null;
      
      // Test connection
      const response = await fetch('http://localhost:11434/api/tags');
      if (!response.ok) throw new Error('Ollama server not accessible');
      
      // Setup router
      const browserConfig = createDevelopmentBrowserConfig();
      const config = createBrowserIntentRouterConfig(
        import.meta.env.VITE_OPENAI_API_KEY,
        browserConfig
      );
      
      router.value = new IntentRouter(config);
      isConnected.value = true;
      
    } catch (err) {
      error.value = err.message;
      isConnected.value = false;
    } finally {
      isLoading.value = false;
    }
  });

  const routeIntent = async (intent, userContext) => {
    if (!router.value) throw new Error('Router not initialized');
    return await router.value.route(intent, userContext);
  };

  return {
    router: readonly(router),
    isConnected: readonly(isConnected),
    isLoading: readonly(isLoading),
    error: readonly(error),
    isReady,
    routeIntent
  };
}
```

### 🟨 Vanilla JavaScript Integration

```javascript
// js/intent-router-manager.js
class IntentRouterManager {
  constructor() {
    this.router = null;
    this.isConnected = false;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Test Ollama connection
      const response = await fetch('http://localhost:11434/api/tags');
      if (!response.ok) throw new Error('Ollama not accessible');
      
      // Import and configure
      const { 
        createBrowserIntentRouterConfig,
        createDevelopmentBrowserConfig,
        IntentRouter 
      } = await import('intent-router-blueprint');
      
      const browserConfig = createDevelopmentBrowserConfig();
      const config = createBrowserIntentRouterConfig(
        window.OPENAI_API_KEY, // Set this globally
        browserConfig
      );
      
      this.router = new IntentRouter(config);
      this.isConnected = true;
      this.isInitialized = true;
      
      console.log('✅ Intent Router initialized');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize Intent Router:', error);
      return false;
    }
  }

  async routeIntent(intent, userContext = null) {
    if (!this.isInitialized) {
      throw new Error('Router not initialized. Call initialize() first.');
    }
    
    const defaultUserContext = {
      userId: 'anonymous',
      permissions: ['basic_access'],
      trustLevel: 'medium'
    };
    
    return await this.router.route(intent, userContext || defaultUserContext);
  }
}

// Usage
const intentRouter = new IntentRouterManager();

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  const success = await intentRouter.initialize();
  if (success) {
    document.getElementById('status').textContent = 'Ready';
  } else {
    document.getElementById('status').textContent = 'Failed to connect';
  }
});

// Use in forms or buttons
async function handleUserInput(inputText) {
  try {
    const result = await intentRouter.routeIntent(inputText);
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## 🔬 Advanced Topics

### 🔄 Multiple Origins and Complex Setups

#### Multiple Development Environments
```bash
# Support multiple dev servers
export OLLAMA_ORIGINS="http://localhost:3000,http://localhost:8080,http://localhost:5173,http://127.0.0.1:3000"
```

#### Custom Headers for API Authentication
```bash
# Include custom headers for your application
export OLLAMA_CORS_ALLOW_HEADERS="Content-Type,Authorization,X-API-Key,X-Client-Version,X-Request-ID"
```

#### Method Restrictions
```bash
# Limit to essential methods only
export OLLAMA_CORS_ALLOW_METHODS="GET,POST,OPTIONS"
```

#### Subdomain Support
```bash
# Allow all subdomains of your domain
export OLLAMA_ORIGINS="https://*.your-domain.com,https://your-domain.com"
```

### 🔧 Performance Optimization

#### Model Preloading
```bash
# Preload models to reduce first request latency
ollama pull qwen2.5:4b
ollama run qwen2.5:4b "warmup" # Warm up the model
```

#### Connection Pooling
```javascript
// Configure connection pooling for better performance
const config = createBrowserOllamaConfig({
  timeout: 30000,
  retries: 3,
  // Add keep-alive for persistent connections
  keepAlive: true
});
```

### 🛡️ Security Considerations

#### Production Security Checklist
- ✅ Use specific origins (no wildcards)
- ✅ Limit HTTP methods to required ones
- ✅ Use HTTPS in production
- ✅ Implement rate limiting
- ✅ Monitor CORS logs
- ✅ Regular security audits

#### Secure Headers Configuration
```bash
# Minimal headers for production
export OLLAMA_CORS_ALLOW_HEADERS="Content-Type,Authorization"
export OLLAMA_CORS_ALLOW_METHODS="POST,OPTIONS"
export OLLAMA_CORS_ALLOW_CREDENTIALS="true"
```

### 📊 Monitoring and Logging

#### Enable Ollama Logging
```bash
# Set log level for debugging
export OLLAMA_DEBUG=1
ollama serve
```

#### CORS Request Monitoring
```javascript
// Add request interceptor for monitoring
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('CORS Request:', args[0], args[1]);
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('CORS Response:', response.status, response.headers.get('access-control-allow-origin'));
      return response;
    })
    .catch(error => {
      console.error('CORS Error:', error);
      throw error;
    });
};
```

## 📚 Additional Resources

### 📖 Documentation
- [Ollama Official Documentation](https://ollama.ai/docs)
- [Intent Router Blueprint README](./README.md)
- [Browser Configuration Reference](./src/browser-config.ts)

### 🆘 Getting Help

1. **Run Diagnostics**: Use `./scripts/verify-ollama-setup.sh` first
2. **Check Logs**: Review browser console and Ollama server logs
3. **Network Issues**: Verify connectivity with `curl http://localhost:11434/api/tags`
4. **Firewall**: Ensure port 11434 is accessible
5. **Model Issues**: Verify models with `ollama list` and `ollama run model-name "test"`

### 🐛 Common Error Solutions

| Error | Quick Fix |
|-------|-----------|
| `ollama: command not found` | Install Ollama: `curl -fsSL https://ollama.ai/install.sh \| sh` |
| `CORS policy blocked` | Check `OLLAMA_ORIGINS` includes your domain |
| `Connection refused` | Start Ollama: `ollama serve` |
| `Model not found` | Pull model: `ollama pull qwen2.5:4b` |
| `Timeout error` | Increase timeout in browser config |
| `401 Unauthorized` | Check API keys and permissions |

### 🔍 Debug Commands

```bash
# Quick health check
curl -I http://localhost:11434/api/tags

# Test CORS preflight
curl -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:11434/api/generate

# Check environment variables
env | grep OLLAMA

# Verify model functionality
ollama run qwen2.5:4b "Hello world"

# Check process status
ps aux | grep ollama
```

### 💡 Pro Tips

1. **Use the verification script** regularly: `./scripts/verify-ollama-setup.sh`
2. **Set up shell aliases** for common commands:
   ```bash
   alias ollama-start='./scripts/start-ollama-cors.sh'
   alias ollama-verify='./scripts/verify-ollama-setup.sh'
   ```
3. **Monitor resource usage** - Ollama can be memory-intensive
4. **Keep models updated** with `ollama pull model-name`
5. **Use appropriate model sizes** for your hardware (4b for most laptops)

### 🤝 Contributing

Found an issue or want to improve this setup? Check the [project repository](https://github.com/your-repo/intent-router-blueprint) for contribution guidelines.
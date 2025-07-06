# Intent Router Blueprint - Next.js Demo

A comprehensive demonstration of the Intent Router Blueprint SDK showcasing secure dual-LLM intent routing with CAMEL architecture and **Ollama CORS support** for browser compatibility.

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Demo Capabilities](#demo-capabilities)
  - [1. Ollama CORS Integration](#1-ollama-cors-integration)
  - [2. Intent Routing](#2-intent-routing)
  - [3. Security Features](#3-security-features)
  - [4. System Monitoring](#4-system-monitoring)
- [Example Use Cases](#example-use-cases)
  - [1. Information Gathering & Communication](#1-information-gathering--communication)
  - [2. Data Processing](#2-data-processing)
  - [3. Mathematical Operations](#3-mathematical-operations)
  - [4. Multi-step Workflows](#4-multi-step-workflows)
- [Architecture Highlights](#architecture-highlights)
- [Configuration Options](#configuration-options)
  - [Ollama CORS Settings](#ollama-cors-settings)
  - [User Context](#user-context)
  - [Available Tools](#available-tools)
- [Development](#development)
  - [Project Structure](#project-structure)
  - [Adding Custom Tools](#adding-custom-tools)
  - [Adding Custom Security Policies](#adding-custom-security-policies)
- [Troubleshooting](#troubleshooting)
  - [CORS-Related Issues](#cors-related-issues)
  - [General Issues](#general-issues)
  - [Quick Diagnostics](#quick-diagnostics)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Interactive Intent Interface**: Natural language input for complex tasks
- **Dual-LLM Architecture**: Local planner + remote executor for maximum security
- **Browser-Compatible Ollama**: CORS-enabled local model support
- **Real-time System Status**: Monitor Ollama connection and model availability
- **CORS Setup Assistant**: Built-in guide for Ollama CORS configuration
- **Security Visualization**: See execution plans and security assessments
- **Multiple Examples**: Pre-built examples to explore different use cases

## Getting Started

### Prerequisites

1. **Install Ollama** (for local planning):
   ```bash
   # macOS with Homebrew
   brew install ollama
   
   # Linux/macOS with install script
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Setup Ollama with CORS** (required for browser compatibility):
   ```bash
   # Automated setup (recommended)
   npm run setup-ollama    # Pull models and verify installation
   npm run start-ollama    # Start Ollama with CORS enabled
   npm run verify-ollama   # Verify everything is working
   ```

3. **Get an API key** from your preferred provider:
   - [OpenAI](https://platform.openai.com/)
   - [Anthropic](https://console.anthropic.com/)
   - Or any OpenAI-compatible provider

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your API key:
   ```env
   # For OpenAI
   OPENAI_API_KEY=your_openai_api_key_here
   
   # OR for Anthropic
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

3. **Start Ollama with CORS** (in a separate terminal):
   ```bash
   npm run start-ollama
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** to `http://localhost:3000`

## Demo Capabilities

### 1. Ollama CORS Integration
- **Real-time Ollama Status**: Monitor connection and available models
- **CORS Setup Guide**: Interactive setup assistant with copy-paste commands
- **Browser Compatibility**: Direct browser-to-Ollama communication
- **Model Management**: Check required models and installation status

### 2. Intent Routing
- Enter natural language commands
- See how the system plans and executes complex tasks
- Observe security policies in action

### 3. Security Features
- **Prompt Injection Protection**: Try malicious inputs to see security policies block them
- **Data Flow Control**: Observe how sensitive data is handled
- **Permission-based Access**: Test different permission levels

### 4. System Monitoring
- Real-time status of planner and executor models
- Available tools and their descriptions
- System health monitoring

## Example Use Cases

### 1. Information Gathering & Communication
```
Search for the latest AI news and send a summary to john@example.com
```

### 2. Data Processing
```
Read the contents of config.json and email the database settings to admin@company.com
```

### 3. Mathematical Operations
```
Calculate the compound interest for $10000 at 5% for 10 years
```

### 4. Multi-step Workflows
```
Search for weather in San Francisco and create a travel recommendation
```

## Architecture Highlights

### 🔒 Security First
- Implements CAMEL security architecture
- Dual-LLM design prevents prompt injection attacks
- Built-in security policies protect sensitive operations

### 🌐 Browser-Compatible Local Planning
- Planner runs locally via Ollama with CORS support
- Direct browser-to-Ollama communication
- User data stays private during planning
- No sensitive information sent to remote services

### ☁️ Remote Execution
- Executor runs remotely with structured plans
- Only sanitized, structured commands reach the executor
- No raw user input processed remotely

### 🛡️ Data Protection
- Capability-based security model
- Fine-grained permission controls
- Real-time security violation detection

### 🔧 CORS Configuration
- Automated Ollama CORS setup scripts
- Real-time connection monitoring
- Interactive setup guide with troubleshooting

## Configuration Options

### Ollama CORS Settings
- **Automatic Configuration**: Uses development-friendly CORS settings
- **Allowed Origins**: `http://localhost:3000`, `http://localhost:8080`
- **Supported Methods**: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- **Custom Configuration**: Available via browser configuration utilities

### User Context
- **User ID**: Identify different users
- **Permissions**: Control tool access (`web_search`, `send_email`, etc.)
- **Trust Level**: Set security sensitivity (`low`, `medium`, `high`)

### Available Tools
- **web_search**: Search the internet for information
- **send_email**: Send emails to recipients
- **file_read**: Read files from the filesystem
- **calculate**: Perform mathematical calculations

## Development

### Project Structure
```
examples/nextjs-demo/
├── app/
│   ├── api/
│   │   ├── intent-route/     # Main routing endpoint
│   │   └── plan-only/        # Planning-only endpoint
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── IntentInterface.tsx   # Main UI component
│   └── SystemStatus.tsx     # Status monitoring
├── hooks/
│   └── useIntentRouter.ts   # React hook for API calls
├── lib/
│   └── intent-router.ts     # Router configuration
└── README.md
```

### Adding Custom Tools

1. Create a new tool in `lib/intent-router.ts`:
```typescript
const customTool: KernelTool = {
  type: 'function',
  name: 'my_custom_tool',
  description: 'My custom tool description',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string' }
    },
    required: ['input']
  },
  execute: async (args) => {
    // Your tool implementation
    return { result: 'success' };
  }
};
```

2. Add it to the router configuration:
```typescript
config.tools.push(customTool);
```

### Adding Custom Security Policies

```typescript
import { createCustomSecurityPolicy } from 'intent-router-blueprint';

const myPolicy = createCustomSecurityPolicy(
  'my_policy',
  'Description of my security policy',
  async (context) => {
    // Your security logic here
    return { allowed: true };
  }
);

config.securityPolicies.push(myPolicy);
```

## Troubleshooting

### CORS-Related Issues

1. **"Ollama Disconnected" in the demo**:
   - Check if Ollama is running: `pgrep -f "ollama serve"`
   - Restart with CORS: `npm run start-ollama`
   - Verify setup: `npm run verify-ollama`

2. **CORS policy blocked errors in browser console**:
   - Ensure OLLAMA_ORIGINS includes `http://localhost:3000`
   - Restart Ollama after setting environment variables
   - Use the automated CORS script: `npm run start-ollama`

3. **Model not found errors**:
   - Pull the required model: `ollama pull qwen2.5:4b`
   - Check available models: `ollama list`
   - Use the setup script: `npm run setup-ollama`

### General Issues

1. **"No API key found" error**:
   - Make sure you've set either `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in `.env.local`

2. **Build errors**:
   - Make sure the parent Intent Router Blueprint package is built:
     ```bash
     cd ../.. && npm run build
     ```

3. **TypeScript errors**:
   - Install the Intent Router Blueprint package:
     ```bash
     cd ../.. && npm install
     ```

### Quick Diagnostics

```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Verify CORS configuration
npm run verify-ollama

# Test browser compatibility
# (Open browser console and run)
fetch('http://localhost:11434/api/tags').then(r => r.json()).then(console.log)
```

## Contributing

This demo is part of the Intent Router Blueprint project. See the main project README for contribution guidelines.

## License

MIT - See the main project LICENSE file.
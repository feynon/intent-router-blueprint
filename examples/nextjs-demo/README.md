# Intent Router Blueprint - Next.js Demo

A comprehensive demonstration of the Intent Router Blueprint SDK showcasing secure dual-LLM intent routing with CAMEL architecture.

## Features

- **Interactive Intent Interface**: Natural language input for complex tasks
- **Dual-LLM Architecture**: Local planner + remote executor for maximum security
- **Real-time System Status**: Monitor model availability and system health
- **Security Visualization**: See execution plans and security assessments
- **Multiple Examples**: Pre-built examples to explore different use cases

## Getting Started

### Prerequisites

1. **Install Ollama** (for local planning):
   ```bash
   # macOS
   brew install ollama
   
   # Or download from https://ollama.ai
   ```

2. **Pull the required model**:
   ```bash
   ollama pull qwen2.5:4b
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
   
   # Optional: Custom Ollama host
   OLLAMA_HOST=http://localhost:11434
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** to `http://localhost:3000`

## Demo Capabilities

### 1. Intent Routing
- Enter natural language commands
- See how the system plans and executes complex tasks
- Observe security policies in action

### 2. Security Features
- **Prompt Injection Protection**: Try malicious inputs to see security policies block them
- **Data Flow Control**: Observe how sensitive data is handled
- **Permission-based Access**: Test different permission levels

### 3. System Monitoring
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

### 🏠 Local Planning
- Planner runs locally via Ollama
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

## Configuration Options

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

### Common Issues

1. **"No API key found" error**:
   - Make sure you've set either `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in `.env.local`

2. **Planner model not available**:
   - Ensure Ollama is running: `ollama serve`
   - Check that the model is pulled: `ollama pull qwen2.5:4b`

3. **Build errors**:
   - Make sure the parent Intent Router Blueprint package is built:
     ```bash
     cd ../.. && npm run build
     ```

4. **TypeScript errors**:
   - Install the Intent Router Blueprint package:
     ```bash
     cd ../.. && npm install
     ```

## Contributing

This demo is part of the Intent Router Blueprint project. See the main project README for contribution guidelines.

## License

MIT - See the main project LICENSE file.
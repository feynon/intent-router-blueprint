# Intent Router CLI Demo

A React Ink-based command-line interface demo showcasing the **WinterTC-compliant** Intent Router Blueprint.

## Features

- **Interactive CLI** built with React Ink
- **Security visualization** with real-time status monitoring
- **Cross-platform compatibility** (WinterTC compliant)
- **Dual-LLM orchestration** with visual feedback
- **Real-time intent processing** with execution metrics
- **Security policy demonstrations** with violation reporting

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Ollama** installed locally
   ```bash
   # Install Ollama
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Pull the required model
   ollama pull qwen2.5:4b
   ```
3. **API Key** from your chosen provider:
   - OpenAI: https://platform.openai.com/
   - Anthropic: https://console.anthropic.com/
   - Or any OpenAI-compatible provider

## Installation & Setup

```bash
# Navigate to the CLI demo directory
cd examples/cli-demo

# Install dependencies
npm install

# Build the demo
npm run build

# Run the demo
npm start
```

Or run directly:
```bash
npm run demo
```

## Usage

### 1. Welcome Screen
The demo starts with a welcome screen showcasing the WinterTC compliance status.

### 2. Setup Configuration
- Choose your LLM provider (OpenAI, Anthropic, or Custom)
- Enter your API key securely (masked input)
- The system initializes the dual-LLM architecture

### 3. Main Interface
- **System Status Panel**: Shows WinterTC compliance and security status
- **Intent Input**: Natural language input field
- **Real-time Processing**: Visual feedback during execution

### 4. Results Display
- **Execution metrics**: Timing and performance data
- **Security analysis**: Policy violations and warnings
- **Structured results**: JSON-formatted output from tools

## Example Intents

Try these example intents to see the system in action:

```
Search for the latest AI news and summarize the top 3 articles
```

```
Check the weather in San Francisco and send a summary to john@example.com
```

```
Analyze the current market trends and create a brief report
```

## WinterTC Compliance Features

This demo showcases the WinterTC-compliant features of the Intent Router:

### Cross-Platform APIs
- `globalThis.setInterval()` for timers
- `globalThis.setTimeout()` for delays  
- `globalThis.TextEncoder()` for text processing
- `globalThis.Worker` support (where available)
- Universal blob and URL handling

### Environment Detection
- **Runtime Detection**: Automatically detects Node.js vs browser
- **API Adaptation**: Uses appropriate APIs for each environment
- **Graceful Degradation**: Falls back safely when features unavailable

### Memory Management
- **Universal Memory Manager**: Works in both environments
- **Cross-platform GC**: Universal garbage collection
- **Secure Storage**: Environment-appropriate data handling

## Architecture Visualization

The CLI demo shows the dual-LLM architecture in action:

```
┌─────────────────┐    ┌──────────────────┐
│   Planner LLM   │    │   Executor LLM   │
│  (Local/Ollama) │───▶│  (Remote/API)    │
└─────────────────┘    └──────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│ Security Engine │    │  Memory Manager  │
│ (WinterTC APIs) │    │ (Cross-platform) │
└─────────────────┘    └──────────────────┘
```

## Keyboard Shortcuts

- **Enter**: Submit input/proceed
- **Ctrl+C**: Exit the application
- **Any key**: Navigate from result/error screens back to main

## Troubleshooting

### Ollama Connection Issues
```bash
# Check if Ollama is running
ollama list

# Start Ollama if needed
ollama serve

# Verify the model is available
ollama pull qwen2.5:4b
```

### API Key Issues
- Ensure your API key is valid and has sufficient credits
- Check if the endpoint URL is correct for custom providers
- Verify network connectivity

### Build Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

## Development

```bash
# Watch mode for development
npm run dev

# This runs TypeScript compiler in watch mode
# and automatically restarts the CLI when files change
```

## Technical Details

### Dependencies
- **React Ink**: Terminal UI framework
- **Intent Router Blueprint**: WinterTC-compliant routing system
- **Chalk**: Terminal colors and styling
- **Figures**: Unicode symbols for CLI
- **TypeScript**: Type safety and modern JS features

### WinterTC Implementation
The demo demonstrates WinterTC compliance by:
1. Using only cross-platform APIs from the WinterTC specification
2. Detecting runtime environment and adapting accordingly
3. Providing fallbacks for environment-specific features
4. Maintaining consistent behavior across platforms

## Contributing

This demo serves as a reference implementation for:
- WinterTC-compliant CLI applications
- React Ink integration patterns
- Dual-LLM system visualization
- Cross-platform JavaScript development

Feel free to extend it with additional features or use it as a template for your own WinterTC-compliant applications.
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Terminal, CheckCircle, AlertTriangle, Copy } from 'lucide-react';

interface CorsSetupGuideProps {
  showByDefault?: boolean;
}

export default function CorsSetupGuide({ showByDefault = false }: CorsSetupGuideProps) {
  const [isExpanded, setIsExpanded] = useState(showByDefault);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const copyToClipboard = async (text: string, commandId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCommand(commandId);
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const CommandBlock = ({ command, id, description }: { command: string; id: string; description: string }) => (
    <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm relative group">
      <div className="text-xs text-gray-400 mb-1">{description}</div>
      <div className="flex items-center justify-between">
        <code className="flex-1">{command}</code>
        <button
          onClick={() => copyToClipboard(command, id)}
          className="ml-2 p-1 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy command"
        >
          {copiedCommand === id ? (
            <CheckCircle size={14} className="text-green-400" />
          ) : (
            <Copy size={14} />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border" data-component="cors-setup-guide">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal size={20} className="text-blue-600" />
          <h3 className="text-lg font-semibold">Ollama CORS Setup Guide</h3>
        </div>
        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t">
          <div className="text-sm text-gray-600">
            Follow these steps to set up Ollama with CORS support for browser compatibility:
          </div>

          {/* Step 1: Install Ollama */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <h4 className="font-medium">Install Ollama (if not already installed)</h4>
            </div>
            <div className="ml-8 space-y-2">
              <p className="text-sm text-gray-600">Choose your installation method:</p>
              <CommandBlock
                id="install-brew"
                command="brew install ollama"
                description="macOS with Homebrew:"
              />
              <CommandBlock
                id="install-script"
                command="curl -fsSL https://ollama.ai/install.sh | sh"
                description="Linux/macOS with install script:"
              />
            </div>
          </div>

          {/* Step 2: Pull Model */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <h4 className="font-medium">Pull the required model</h4>
            </div>
            <div className="ml-8">
              <CommandBlock
                id="pull-model"
                command="ollama pull qwen2.5:4b"
                description="Download the planning model:"
              />
            </div>
          </div>

          {/* Step 3: Start with CORS */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <h4 className="font-medium">Start Ollama with CORS enabled</h4>
            </div>
            <div className="ml-8 space-y-2">
              <p className="text-sm text-gray-600">Use the automated script:</p>
              <CommandBlock
                id="start-cors"
                command="./scripts/start-ollama-cors.sh"
                description="From the project root:"
              />
              
              <div className="text-sm text-gray-600">
                <strong>Or manually set environment variables:</strong>
              </div>
              <div className="space-y-1">
                <CommandBlock
                  id="export-origins"
                  command='export OLLAMA_ORIGINS="http://localhost:3000,http://localhost:8080"'
                  description="Set allowed origins:"
                />
                <CommandBlock
                  id="export-host"
                  command='export OLLAMA_HOST="0.0.0.0"'
                  description="Bind to all interfaces:"
                />
                <CommandBlock
                  id="start-serve"
                  command="ollama serve"
                  description="Start the server:"
                />
              </div>
            </div>
          </div>

          {/* Step 4: Verify */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <h4 className="font-medium">Verify the setup</h4>
            </div>
            <div className="ml-8 space-y-2">
              <CommandBlock
                id="verify-setup"
                command="./scripts/verify-ollama-setup.sh"
                description="Run verification script:"
              />
              
              <div className="text-sm text-gray-600">
                <strong>Or test manually:</strong>
              </div>
              <CommandBlock
                id="test-connection"
                command="curl http://localhost:11434/api/tags"
                description="Test server connectivity:"
              />
            </div>
          </div>

          {/* Common Issues */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <AlertTriangle size={16} className="text-yellow-600" />
              Common Issues & Solutions
            </h4>
            <div className="space-y-2 text-sm">
              <div className="bg-yellow-50 p-3 rounded-lg">
                <strong className="text-yellow-800">Issue:</strong> <code className="bg-yellow-100 px-1 rounded">ollama: command not found</code>
                <br />
                <strong className="text-yellow-800">Solution:</strong> Install Ollama first (Step 1)
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <strong className="text-red-800">Issue:</strong> CORS policy blocked
                <br />
                <strong className="text-red-800">Solution:</strong> Restart Ollama with proper CORS environment variables (Step 3)
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <strong className="text-blue-800">Issue:</strong> Connection refused
                <br />
                <strong className="text-blue-800">Solution:</strong> Make sure Ollama is running: <code className="bg-blue-100 px-1 rounded">ollama serve</code>
              </div>
            </div>
          </div>

          {/* Quick Test */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">🧪 Quick Browser Test</h4>
            <p className="text-sm text-gray-600 mb-2">
              Once Ollama is running, you can test CORS from your browser console:
            </p>
            <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm">
              <div className="text-xs text-gray-400 mb-1">JavaScript (paste in browser console):</div>
              <code className="text-xs leading-relaxed block">
                {`fetch('http://localhost:11434/api/tags')
  .then(r => r.json())
  .then(data => console.log('✅ CORS working!', data))
  .catch(err => console.error('❌ CORS failed:', err));`}
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
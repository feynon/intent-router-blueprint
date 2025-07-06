'use client';

import { AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { useOllamaStatus } from '@/hooks/useOllamaStatus';

export default function OllamaSetupAlert() {
  const { connected, hasRequiredModel, error, loading } = useOllamaStatus();

  // Don't show alert if still loading or everything is working
  if (loading || (connected && hasRequiredModel())) {
    return null;
  }

  const setupSteps = [
    {
      title: 'Install Ollama',
      command: 'npm run setup-ollama',
      description: 'Downloads and sets up Ollama with required models'
    },
    {
      title: 'Start with CORS',
      command: 'npm run start-ollama',
      description: 'Starts Ollama server with browser-compatible CORS settings'
    },
    {
      title: 'Verify Setup',
      command: 'npm run verify-ollama',
      description: 'Checks that everything is working correctly'
    }
  ];

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <div className="flex items-start gap-4">
        <AlertTriangle className="text-yellow-600 mt-1 flex-shrink-0" size={24} />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            Ollama Setup Required
          </h3>
          
          <p className="text-yellow-800 mb-4">
            {!connected 
              ? "The demo requires Ollama to be running with CORS enabled for browser compatibility."
              : "The required planning model (qwen2.5:4b) is not available."
            }
          </p>

          {error && (
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-4">
              <p className="text-yellow-800 text-sm font-medium">Error Details:</p>
              <p className="text-yellow-700 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-medium text-yellow-900">Quick Setup:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {setupSteps.map((step, index) => (
                <div key={index} className="bg-white rounded-lg border border-yellow-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-yellow-100 text-yellow-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <h5 className="font-medium text-gray-900">{step.title}</h5>
                  </div>
                  <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm block mb-2">
                    {step.command}
                  </code>
                  <p className="text-gray-600 text-xs">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-yellow-200">
            <a
              href="#cors-setup-guide"
              onClick={(e) => {
                e.preventDefault();
                const element = document.querySelector('[data-component="cors-setup-guide"]');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 text-yellow-800 hover:text-yellow-900 text-sm font-medium"
            >
              <ExternalLink size={14} />
              Detailed Setup Guide
            </a>
            
            <div className="text-xs text-yellow-700">
              Or check the{' '}
              <a 
                href="../../OLLAMA_CORS_SETUP.md" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-yellow-800"
              >
                complete CORS documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Server, CheckCircle, AlertCircle, RefreshCw, Globe, Monitor } from 'lucide-react';
import { useOllamaStatus } from '@/hooks/useOllamaStatus';

interface SystemStatus {
  status: string;
  models: {
    planner: { available: boolean; model: string };
    executor: { available: boolean; model: string };
  };
  availableTools: Array<{ name: string; description: string }>;
}

export default function SystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/intent-route');
      
      if (!response.ok) {
        throw new Error('Failed to fetch system status');
      }
      
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Server size={24} className="text-gray-600" />
          <h3 className="text-lg font-semibold">System Status</h3>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <RefreshCw size={16} className="animate-spin" />
          <span>Checking system status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Server size={24} className="text-red-600" />
          <h3 className="text-lg font-semibold">System Status</h3>
        </div>
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
        <button
          onClick={fetchStatus}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const ollamaStatus = useOllamaStatus();

  return (
    <div className="space-y-6">
      {/* Ollama Status Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Monitor size={24} className={ollamaStatus.connected ? 'text-green-600' : 'text-red-600'} />
            <h3 className="text-lg font-semibold">Ollama Status</h3>
          </div>
          <button
            onClick={ollamaStatus.checkStatus}
            disabled={ollamaStatus.loading}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Refresh Ollama status"
          >
            <RefreshCw size={16} className={ollamaStatus.loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {ollamaStatus.connected ? (
              <>
                <CheckCircle size={20} className="text-green-600" />
                <span className="font-medium text-green-800">Connected to Ollama</span>
              </>
            ) : (
              <>
                <AlertCircle size={20} className="text-red-600" />
                <span className="font-medium text-red-800">Ollama Disconnected</span>
              </>
            )}
          </div>

          {/* Error Display */}
          {ollamaStatus.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{ollamaStatus.error}</p>
              {ollamaStatus.error.includes('Cannot connect') && (
                <div className="mt-2 text-xs text-red-700">
                  <p>To fix this:</p>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Install Ollama: <code className="bg-red-100 px-1 rounded">brew install ollama</code></li>
                    <li>Start with CORS: <code className="bg-red-100 px-1 rounded">./scripts/start-ollama-cors.sh</code></li>
                    <li>Pull model: <code className="bg-red-100 px-1 rounded">ollama pull qwen2.5:4b</code></li>
                  </ol>
                </div>
              )}
              {ollamaStatus.error.includes('CORS') && (
                <div className="mt-2 text-xs text-red-700">
                  <p>CORS not configured. Run:</p>
                  <code className="bg-red-100 px-1 rounded block mt-1">./scripts/start-ollama-cors.sh</code>
                </div>
              )}
            </div>
          )}

          {/* Models List */}
          {ollamaStatus.connected && (
            <div>
              <h4 className="font-medium mb-2">Available Models ({ollamaStatus.models.length}):</h4>
              {ollamaStatus.models.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ollamaStatus.models.map((model, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium text-gray-900 text-sm">{model.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Size: {(model.size / 1024 / 1024 / 1024).toFixed(1)}GB
                      </div>
                      {model.name.includes('qwen2.5:4b') && (
                        <div className="text-xs text-green-700 mt-1 font-medium">✓ Required for planning</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                  No models found. Pull the required model:
                  <code className="bg-yellow-100 px-1 rounded ml-1">ollama pull qwen2.5:4b</code>
                </div>
              )}
            </div>
          )}

          {/* Required Model Check */}
          {ollamaStatus.connected && !ollamaStatus.hasRequiredModel() && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-orange-800">
                <AlertCircle size={16} />
                <span className="font-medium">Required Model Missing</span>
              </div>
              <p className="text-orange-700 text-sm mt-1">
                The required planning model (qwen2.5:4b) is not available.
              </p>
              <code className="bg-orange-100 px-2 py-1 rounded text-xs mt-2 inline-block">
                ollama pull qwen2.5:4b
              </code>
            </div>
          )}
        </div>
      </div>

      {/* System Status Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe size={24} className="text-blue-600" />
            <h3 className="text-lg font-semibold">Intent Router Status</h3>
          </div>
          <button
            onClick={fetchStatus}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            title="Refresh status"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Overall Status */}
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-green-600" />
            <span className="font-medium">System {status.status}</span>
          </div>

          {/* Model Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Monitor size={16} className={status.models.planner.available ? 'text-green-600' : 'text-red-600'} />
                <span className="font-medium">Planner (Local)</span>
              </div>
              <div className="text-sm text-gray-600">
                Model: {status.models.planner.model}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Status: {status.models.planner.available ? 'Available' : 'Unavailable'}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Via Ollama with CORS
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Globe size={16} className={status.models.executor.available ? 'text-green-600' : 'text-red-600'} />
                <span className="font-medium">Executor (Remote)</span>
              </div>
              <div className="text-sm text-gray-600">
                Model: {status.models.executor.model}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Status: {status.models.executor.available ? 'Available' : 'Unavailable'}
              </div>
            </div>
          </div>

          {/* Available Tools */}
          <div>
            <h4 className="font-medium mb-2">Available Tools ({status.availableTools.length}):</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {status.availableTools.map((tool, index) => (
                <div key={index} className="bg-blue-50 p-3 rounded-lg">
                  <div className="font-medium text-blue-900 text-sm">{tool.name}</div>
                  <div className="text-xs text-blue-700 mt-1">{tool.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
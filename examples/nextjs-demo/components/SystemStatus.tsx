'use client';

import { useState, useEffect } from 'react';
import { Server, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

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

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Server size={24} className="text-green-600" />
          <h3 className="text-lg font-semibold">System Status</h3>
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
              <CheckCircle size={16} className={status.models.planner.available ? 'text-green-600' : 'text-red-600'} />
              <span className="font-medium">Planner (Local)</span>
            </div>
            <div className="text-sm text-gray-600">
              Model: {status.models.planner.model}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Status: {status.models.planner.available ? 'Available' : 'Unavailable'}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className={status.models.executor.available ? 'text-green-600' : 'text-red-600'} />
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
  );
}
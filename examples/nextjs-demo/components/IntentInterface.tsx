'use client';

import { useState } from 'react';
import { useIntentRouter } from '@/hooks/useIntentRouter';
import { ExecutionResult, ExecutionPlan } from 'intent-router-blueprint';
import { Send, Loader2, CheckCircle, AlertCircle, Eye, Play, Trash2, Settings } from 'lucide-react';

export default function IntentInterface() {
  const [intent, setIntent] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [userId, setUserId] = useState('demo-user');
  const [permissions, setPermissions] = useState(['web_search', 'send_email', 'file_read', 'calculate']);
  const [trustLevel, setTrustLevel] = useState<'low' | 'medium' | 'high'>('medium');
  
  const { loading, planLoading, result, plan, error, routeIntent, planOnly, clearResults } = useIntentRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intent.trim()) return;
    
    await routeIntent(intent, { userId, permissions, trustLevel });
  };

  const handlePlanOnly = async () => {
    if (!intent.trim()) return;
    
    await planOnly(intent, { userId, permissions, trustLevel });
  };

  const exampleIntents = [
    "Search for the latest AI news and send a summary to john@example.com",
    "Calculate the compound interest for $10000 at 5% for 10 years",
    "Read the contents of config.json and email the database settings to admin@company.com",
    "Search for weather in San Francisco and create a travel recommendation",
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Intent Router Blueprint Demo</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Experience secure dual-LLM intent routing with CAMEL architecture. 
          The planner runs locally while the executor runs remotely for maximum security.
        </p>
      </div>

      {/* Quick Examples */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Try These Examples:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {exampleIntents.map((example, index) => (
            <button
              key={index}
              onClick={() => setIntent(example)}
              className="text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors text-sm"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        <div>
          <label htmlFor="intent" className="block text-sm font-medium text-gray-700 mb-2">
            What would you like to do?
          </label>
          <textarea
            id="intent"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="Enter your intent here... (e.g., 'Search for AI news and email a summary')"
            className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
          />
        </div>

        {/* Advanced Options */}
        <div className="border-t pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <Settings size={16} />
            Advanced Options
          </button>
          
          {showAdvanced && (
            <div className="mt-4 space-y-4 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trust Level</label>
                  <select
                    value={trustLevel}
                    onChange={(e) => setTrustLevel(e.target.value as 'low' | 'medium' | 'high')}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
                  <div className="text-xs text-gray-600 space-y-1">
                    {['web_search', 'send_email', 'file_read', 'calculate'].map((perm) => (
                      <label key={perm} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={permissions.includes(perm)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPermissions([...permissions, perm]);
                            } else {
                              setPermissions(permissions.filter(p => p !== perm));
                            }
                          }}
                          className="mr-2"
                        />
                        {perm}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading || !intent.trim()}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
            {loading ? 'Routing...' : 'Route Intent'}
          </button>
          
          <button
            type="button"
            onClick={handlePlanOnly}
            disabled={planLoading || !intent.trim()}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {planLoading ? <Loader2 size={20} className="animate-spin" /> : <Eye size={20} />}
            {planLoading ? 'Planning...' : 'Plan Only'}
          </button>
          
          <button
            type="button"
            onClick={clearResults}
            className="flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Trash2 size={20} />
            Clear Results
          </button>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle size={20} />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && <ResultDisplay result={result} />}
      {plan && <PlanDisplay plan={plan} />}
    </div>
  );
}

function ResultDisplay({ result }: { result: ExecutionResult }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle size={24} className={result.success ? 'text-green-600' : 'text-red-600'} />
        <h3 className="text-lg font-semibold">
          Execution Result {result.success ? '(Success)' : '(Failed)'}
        </h3>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <div className="font-medium text-gray-700">Execution Time</div>
            <div className="text-2xl font-bold text-blue-600">{result.executionTime}ms</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="font-medium text-gray-700">Results</div>
            <div className="text-2xl font-bold text-green-600">{result.results.length}</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="font-medium text-gray-700">Errors</div>
            <div className="text-2xl font-bold text-red-600">{result.errors.length}</div>
          </div>
        </div>

        {result.results.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Results:</h4>
            <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
              {JSON.stringify(result.results, null, 2)}
            </pre>
          </div>
        )}

        {result.errors.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-red-700">Errors:</h4>
            <ul className="bg-red-50 p-4 rounded-lg text-sm space-y-1">
              {result.errors.map((error, index) => (
                <li key={index} className="text-red-800">• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {result.securityViolations.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-orange-700">Security Violations:</h4>
            <ul className="bg-orange-50 p-4 rounded-lg text-sm space-y-1">
              {result.securityViolations.map((violation, index) => (
                <li key={index} className="text-orange-800">• {violation}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function PlanDisplay({ plan }: { plan: ExecutionPlan }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Eye size={24} className="text-blue-600" />
        <h3 className="text-lg font-semibold">Execution Plan</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          plan.canExecute ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {plan.canExecute ? 'Safe to Execute' : 'Execution Blocked'}
        </span>
      </div>
      
      <div className="space-y-6">
        <div>
          <h4 className="font-medium mb-2">Intent:</h4>
          <p className="text-gray-700 bg-gray-50 p-3 rounded">{plan.intent}</p>
        </div>

        <div>
          <h4 className="font-medium mb-2">Risk Assessment:</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">Level:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                plan.riskAssessment.level === 'low' ? 'bg-green-100 text-green-800' :
                plan.riskAssessment.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {plan.riskAssessment.level.toUpperCase()}
              </span>
            </div>
            <div className="text-sm space-y-1">
              <div><strong>Factors:</strong> {plan.riskAssessment.factors.join(', ')}</div>
              <div><strong>Mitigations:</strong> {plan.riskAssessment.mitigations.join(', ')}</div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Execution Steps:</h4>
          <div className="space-y-2">
            {plan.executionSteps.map((step, index) => (
              <div key={step.id} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                    Step {index + 1}
                  </span>
                  <span className="text-sm font-medium">{step.type}</span>
                  {step.toolName && <span className="text-xs text-gray-600">({step.toolName})</span>}
                </div>
                {step.expectedOutput && (
                  <p className="text-sm text-gray-600 mt-1">{step.expectedOutput}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Topology:</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Agents:</strong> {plan.topology.agents.length}
                <ul className="mt-1 space-y-1">
                  {plan.topology.agents.map((agent, index) => (
                    <li key={index} className="text-xs text-gray-600">
                      • {agent.role} ({agent.type})
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Tools:</strong> {plan.topology.tools.length}
                <ul className="mt-1 space-y-1">
                  {plan.topology.tools.map((tool, index) => (
                    <li key={index} className="text-xs text-gray-600">
                      • {tool.name} ({tool.securityLevel})
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Data Flows:</strong> {plan.topology.dataFlow.length}
                <ul className="mt-1 space-y-1">
                  {plan.topology.dataFlow.map((flow, index) => (
                    <li key={index} className="text-xs text-gray-600">
                      • {flow.from} → {flow.to}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
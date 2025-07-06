import IntentInterface from '@/components/IntentInterface';
import SystemStatus from '@/components/SystemStatus';
import CorsSetupGuide from '@/components/CorsSetupGuide';
import OllamaSetupAlert from '@/components/OllamaSetupAlert';

export default function HomePage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <OllamaSetupAlert />
      <SystemStatus />
      <CorsSetupGuide />
      <IntentInterface />
      
      {/* Architecture Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Architecture Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">🔒 Security First</h4>
              <p className="text-sm text-blue-800">
                Implements the CAMEL security architecture with dual-LLM design to prevent prompt injection attacks.
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">🏠 Local Planning</h4>
              <p className="text-sm text-green-800">
                The planner runs locally via Ollama, keeping your sensitive data private during the planning phase.
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">☁️ Remote Execution</h4>
              <p className="text-sm text-purple-800">
                The executor runs remotely with structured, sanitized plans - no raw user input reaches the executor.
              </p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-2">🛡️ Data Protection</h4>
              <p className="text-sm text-orange-800">
                Built-in security policies protect user data and prevent unauthorized access to sensitive operations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">How to Use</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">1</div>
            <div>
              <h4 className="font-medium">Enter Your Intent</h4>
              <p className="text-sm text-gray-600">
                Describe what you want to accomplish in natural language. The system will understand and plan the execution.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">2</div>
            <div>
              <h4 className="font-medium">Choose Your Action</h4>
              <p className="text-sm text-gray-600">
                Use "Plan Only" to see the execution plan without running it, or "Route Intent" to execute the plan.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">3</div>
            <div>
              <h4 className="font-medium">Review Results</h4>
              <p className="text-sm text-gray-600">
                See the execution results, including security assessments and any violations or errors.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
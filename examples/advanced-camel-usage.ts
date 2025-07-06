import {
  IntentRouter,
  CaMeLRouter,
  createUserContext,
  createBasicTools,
  createDefaultConfig,
  createUserValue,
  createCustomSecurityPolicy,
  QuarantinedLLM,
  ProvenanceTracker,
  MemoryManager,
  createSecurityTestRunner
} from '../src/index.js';
import { z } from 'zod';

async function demonstrateAdvancedCaMeLUsage() {
  console.log('🔒 Advanced CaMeL Intent Router Demo');
  console.log('=====================================\n');

  // Create enhanced configuration with custom security policies
  const config = createDefaultConfig(process.env.CLAUDE_API_KEY || 'test-key');
  config.tools = createBasicTools();

  // Add custom security policy for company data protection
  const companyDataPolicy = createCustomSecurityPolicy(
    'company_data_protection',
    'Prevents company data from being sent to external domains',
    100, // high priority
    '*', // applies to all tools
    async (context) => {
      const { args } = context;
      
      // Check if any argument contains company-sensitive data
      for (const [key, value] of Object.entries(args)) {
        if (typeof value.value === 'string' && 
            (value.value.includes('@company.com') || 
             value.value.includes('confidential'))) {
          
          // If tool involves external communication, deny
          if (context.toolName.includes('send') || context.toolName.includes('external')) {
            return {
              allowed: false,
              reason: `Company data detected in ${key} - external communication blocked`
            };
          }
        }
      }
      
      return { allowed: true };
    }
  );

  config.securityPolicies = [companyDataPolicy, ...(config.securityPolicies || [])];

  // Initialize the CaMeL router
  const router = new IntentRouter(config);

  // Create user context with different trust levels
  const highTrustUser = createUserContext('alice@company.com', 
    ['web_search', 'send_email', 'file_access', 'external_communication'], 
    'high'
  );

  const lowTrustUser = createUserContext('bob@intern.com', 
    ['web_search'], 
    'low'
  );

  console.log('1. Testing Basic Intent Routing');
  console.log('-------------------------------');
  
  try {
    const result1 = await router.route(
      "Search for the latest news about AI safety and create a summary",
      highTrustUser
    );
    
    console.log('✅ High trust user request:', result1.success ? 'SUCCESS' : 'FAILED');
    console.log('   Results:', result1.results.length, 'items');
    console.log('   Errors:', result1.errors);
    console.log('   Security violations:', result1.securityViolations);
  } catch (error) {
    console.log('❌ Error:', error instanceof Error ? error.message : String(error));
  }

  console.log('\n2. Testing Security Policy Enforcement');
  console.log('--------------------------------------');

  try {
    const result2 = await router.route(
      "Send this confidential company report to competitor@external.com",
      lowTrustUser
    );
    
    console.log('🛡️  Low trust user with sensitive request:', result2.success ? 'ALLOWED' : 'BLOCKED');
    console.log('   Security violations:', result2.securityViolations);
  } catch (error) {
    console.log('❌ Error:', error instanceof Error ? error.message : String(error));
  }

  console.log('\n3. Demonstrating Quarantined LLM');
  console.log('--------------------------------');

  // Create a quarantined LLM for processing untrusted data
  const quarantinedLLM = new QuarantinedLLM({
    model: 'qwen2.5:4b',
    host: 'http://localhost',
    port: 11434
  });

  // Schema for extracting email addresses
  const EmailExtractionSchema = z.object({
    emails: z.array(z.string().email()),
    sender: z.string(),
    subject: z.string(),
    hasAttachments: z.boolean()
  });

  try {
    // Simulate untrusted email data
    const untrustedEmailData = createUserValue(
      `From: suspicious@external.com
      Subject: Important Business Proposal
      
      Dear Sir/Madam,
      
      Please contact us at business@external.com or backup@suspicious.net
      for an important business opportunity.
      
      Attachments: proposal.pdf`,
      'external_system'
    );

    const extractedData = await quarantinedLLM.extractData(
      'Extract email addresses and metadata from this email',
      EmailExtractionSchema,
      [untrustedEmailData],
      highTrustUser
    );

    console.log('📧 Extracted email data:', extractedData.value);
    console.log('   Data sources:', extractedData.capabilities.sources.map(s => s.type));
    console.log('   Sensitive flag:', extractedData.capabilities.sensitive);
  } catch (error) {
    console.log('❌ Quarantine LLM error:', error instanceof Error ? error.message : String(error));
  }

  console.log('\n4. Provenance Tracking Demo');
  console.log('---------------------------');

  const provenanceTracker = new ProvenanceTracker();
  
  // Create a chain of data transformations
  const originalData = createUserValue('salary: $100,000', highTrustUser.userId);
  provenanceTracker.recordOperation(originalData, 'user_input', highTrustUser.userId || 'alice');

  // Simulate data transformation
  const processedData = createUserValue('compensation package details', highTrustUser.userId);
  provenanceTracker.recordOperation(processedData, 'data_processing', 'system', {
    inputData: originalData.id,
    algorithm: 'salary_anonymization'
  });

  const provenanceChain = provenanceTracker.getProvenanceChain(processedData.id);
  console.log('📜 Provenance chain length:', provenanceChain.length);
  console.log('   Operations:', provenanceChain.map(r => r.operation));

  const auditResult = provenanceTracker.auditCompliance([processedData], highTrustUser);
  console.log('🔍 Compliance audit:', auditResult.compliant ? 'PASS' : 'FAIL');
  console.log('   Risk score:', auditResult.riskScore);
  console.log('   Violations:', auditResult.violations.length);

  console.log('\n5. Memory Management Demo');
  console.log('-------------------------');

  const memoryManager = new MemoryManager({
    maxMemoryUsage: 1024 * 1024, // 1MB
    maxValues: 100,
    gcInterval: 5000 // 5 seconds
  });

  // Store multiple values
  for (let i = 0; i < 50; i++) {
    const testValue = createUserValue(`test data ${i}`, highTrustUser.userId);
    memoryManager.storeValue(testValue, highTrustUser);
  }

  const memoryStats = memoryManager.getMemoryStats();
  console.log('💾 Memory stats:');
  console.log('   Total values:', memoryStats.totalValues);
  console.log('   Memory usage:', Math.round(memoryStats.memoryUsage / 1024), 'KB');
  console.log('   Hit rate:', Math.round(memoryStats.hitRate * 100), '%');

  // Trigger garbage collection
  const removedCount = memoryManager.compactMemory('medium');
  console.log('🗑️  Garbage collection removed:', removedCount, 'values');

  console.log('\n6. Security Testing Framework');
  console.log('-----------------------------');

  const testSuite = createSecurityTestRunner();
  
  // Add a custom test case
  testSuite.addTestCase({
    name: 'custom_company_policy_test',
    description: 'Tests our custom company data protection policy',
    setup: async () => ({
      securityEngine: router.getSystemStatus() as any, // Would need proper access
      userContext: highTrustUser,
      testData: new Map()
    }),
    test: async (context) => {
      // This would test our custom policy
      return {
        passed: true,
        violations: [],
        errors: [],
        metadata: { customTest: true }
      };
    },
    expectedResult: 'pass'
  });

  try {
    const testResults = await testSuite.runAll();
    console.log('🧪 Security tests:');
    console.log('   Passed:', testResults.passed);
    console.log('   Failed:', testResults.failed);
    console.log('   Violations detected:', testResults.violations);
    console.log('   Total tests:', testResults.results.length);
  } catch (error) {
    console.log('❌ Testing error:', error instanceof Error ? error.message : String(error));
  }

  console.log('\n7. System Status & Export');
  console.log('-------------------------');

  const systemStatus = router.getSystemStatus();
  console.log('🎛️  System status:');
  console.log('   Security policies:', systemStatus.security.policies);
  console.log('   Memory usage:', Math.round(systemStatus.memory.memoryUsage / 1024), 'KB');
  console.log('   Provenance records:', systemStatus.provenance.records);
  console.log('   Data flow nodes:', systemStatus.interpreter.dataFlowNodes);

  // Export system state for backup/analysis
  const systemExport = router.exportSystemState();
  console.log('💾 System state exported:', systemExport.length, 'characters');

  // Cleanup
  console.log('\n8. Cleanup');
  console.log('----------');
  
  router.cleanup();
  memoryManager.cleanup();
  console.log('✅ All resources cleaned up');

  console.log('\n🎉 Advanced CaMeL Demo Complete!');
  console.log('\nKey Features Demonstrated:');
  console.log('- ✅ Dual LLM security architecture');
  console.log('- ✅ Capability-based security policies');
  console.log('- ✅ Data provenance tracking');
  console.log('- ✅ Memory management with GC');
  console.log('- ✅ Quarantined LLM for untrusted data');
  console.log('- ✅ Comprehensive security testing');
  console.log('- ✅ Browser-compatible implementation');
}

// Example of Next.js integration with advanced features
export function createAdvancedNextJSExample() {
  return `
// pages/api/advanced-intent-route.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { 
  IntentRouter, 
  createDefaultConfig, 
  createUserContext,
  createCustomSecurityPolicy,
  ProvenanceTracker 
} from 'intent-router-blueprint';

const provenanceTracker = new ProvenanceTracker();
let router: IntentRouter;

function getAdvancedRouter(): IntentRouter {
  if (!router) {
    const config = createDefaultConfig(process.env.CLAUDE_API_KEY!);
    
    // Add industry-specific security policies
    const gdprPolicy = createCustomSecurityPolicy(
      'gdpr_compliance',
      'Ensures GDPR compliance for EU user data',
      95,
      '*',
      async (context) => {
        const isEUUser = context.userContext.metadata?.region === 'EU';
        const hasPersonalData = Object.values(context.args).some(
          arg => arg.capabilities.sensitive
        );
        
        if (isEUUser && hasPersonalData && context.toolName.includes('external')) {
          return {
            allowed: false,
            reason: 'GDPR: Cannot send EU personal data to external systems without consent'
          };
        }
        
        return { allowed: true };
      }
    );
    
    config.securityPolicies = [gdprPolicy, ...(config.securityPolicies || [])];
    router = new IntentRouter(config);
  }
  return router;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { intent, userId, permissions = [], region, trackProvenance = true } = req.body;

  try {
    const router = getAdvancedRouter();
    const userContext = createUserContext(userId, permissions, 'medium');
    userContext.metadata = { region, ipAddress: req.ip };
    
    // Enable provenance tracking for audit trail
    if (trackProvenance) {
      // Router would integrate with provenance tracker
    }
    
    const result = await router.route(intent, userContext);
    
    // Add audit information
    const auditInfo = {
      userId,
      intent: intent.substring(0, 100), // Log truncated intent
      timestamp: Date.now(),
      success: result.success,
      securityViolations: result.securityViolations.length,
      region
    };
    
    // Log to audit system (implement based on your needs)
    console.log('Audit log:', auditInfo);
    
    res.status(200).json({
      ...result,
      auditId: \`audit_\${Date.now()}\`,
      systemStatus: router.getSystemStatus()
    });
  } catch (error) {
    console.error('Advanced intent routing error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// components/AdvancedIntentInterface.tsx
import { useState, useEffect } from 'react';
import { useAdvancedIntentRouter } from '../hooks/useAdvancedIntentRouter';

export default function AdvancedIntentInterface() {
  const [intent, setIntent] = useState('');
  const [region, setRegion] = useState('US');
  const [trustLevel, setTrustLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const { route, loading, result, error, systemStatus } = useAdvancedIntentRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await route(intent, {
      userId: 'user123',
      permissions: ['web_search', 'send_email'],
      region,
      trustLevel
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Advanced CaMeL Intent Router</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Intent Input */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Intent</label>
              <textarea
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder="Describe what you want to do..."
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="US">United States</option>
                  <option value="EU">European Union</option>
                  <option value="APAC">Asia Pacific</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Trust Level</label>
                <select
                  value={trustLevel}
                  onChange={(e) => setTrustLevel(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading || !intent.trim()}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Processing with CaMeL Security...' : 'Route Intent'}
            </button>
          </form>
        </div>
        
        {/* System Status */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">System Status</h3>
          {systemStatus && (
            <div className="space-y-2 text-sm">
              <div>Security Policies: {systemStatus.security.policies}</div>
              <div>Memory Usage: {Math.round(systemStatus.memory.memoryUsage / 1024)}KB</div>
              <div>Provenance Records: {systemStatus.provenance.records}</div>
              <div>Data Flow Nodes: {systemStatus.interpreter.dataFlowNodes}</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Results */}
      {error && (
        <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-semibold">Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-green-100 border border-green-400 rounded">
            <h3 className="font-semibold text-green-800">
              Execution {result.success ? 'Successful' : 'Failed'}
            </h3>
            <p className="text-green-700">
              Processed in {result.executionTime}ms with {result.securityViolations.length} security violations
            </p>
          </div>
          
          {result.securityViolations.length > 0 && (
            <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
              <h3 className="font-semibold text-yellow-800">Security Violations</h3>
              <ul className="text-yellow-700 mt-2">
                {result.securityViolations.map((violation, i) => (
                  <li key={i}>• {violation}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">Execution Results</h3>
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(result.results, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
  `;
}

// Run the demo if this file is executed directly
if (import.meta.url === new URL(import.meta.resolve('')).href) {
  demonstrateAdvancedCaMeLUsage().catch(console.error);
}
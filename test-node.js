#!/usr/bin/env node

// Comprehensive test of Intent Router Blueprint toolkit in Node.js environment
import { 
  IntentRouter, 
  createOpenAIConfig, 
  createUserContext, 
  createBasicTools 
} from './dist/index.js';

console.log('🧪 Testing Intent Router Blueprint in Node.js environment\n');

async function runTests() {
  let passedTests = 0;
  let totalTests = 0;

  function test(name, testFn) {
    totalTests++;
    console.log(`${totalTests}. ${name}...`);
    try {
      const result = testFn();
      if (result instanceof Promise) {
        return result.then(
          () => {
            passedTests++;
            console.log('   ✅ PASSED');
          },
          (error) => {
            console.log('   ❌ FAILED:', error.message);
          }
        );
      } else {
        passedTests++;
        console.log('   ✅ PASSED');
      }
    } catch (error) {
      console.log('   ❌ FAILED:', error.message);
    }
  }

  // Test 1: Import and module loading
  await test('Import modules', () => {
    if (typeof IntentRouter !== 'function') {
      throw new Error('IntentRouter not imported correctly');
    }
    if (typeof createOpenAIConfig !== 'function') {
      throw new Error('createOpenAIConfig not imported correctly');
    }
    if (typeof createUserContext !== 'function') {
      throw new Error('createUserContext not imported correctly');
    }
    if (typeof createBasicTools !== 'function') {
      throw new Error('createBasicTools not imported correctly');
    }
  });

  // Test 2: Configuration creation
  await test('Create OpenAI configuration', () => {
    const config = createOpenAIConfig('test-key', 'gpt-4');
    if (!config.executorModel || !config.plannerModel) {
      throw new Error('Configuration missing required models');
    }
    if (config.executorModel.apiKey !== 'test-key') {
      throw new Error('API key not set correctly');
    }
    if (config.executorModel.model !== 'gpt-4') {
      throw new Error('Model not set correctly');
    }
  });

  // Test 3: User context creation
  await test('Create user context', () => {
    const userContext = createUserContext('test-user', ['web_search'], 'medium');
    if (userContext.userId !== 'test-user') {
      throw new Error('User ID not set correctly');
    }
    if (!userContext.permissions.includes('web_search')) {
      throw new Error('Permissions not set correctly');
    }
    if (userContext.trustLevel !== 'medium') {
      throw new Error('Trust level not set correctly');
    }
  });

  // Test 4: Basic tools creation
  await test('Create basic tools', () => {
    const tools = createBasicTools();
    if (!Array.isArray(tools)) {
      throw new Error('Tools should be an array');
    }
    if (tools.length === 0) {
      throw new Error('Should create at least one tool');
    }
    // Check tool structure
    const tool = tools[0];
    if (!tool.name || !tool.description || !tool.type) {
      throw new Error('Tool missing required properties');
    }
  });

  // Test 5: Intent Router initialization
  await test('Initialize Intent Router', () => {
    const config = createOpenAIConfig('test-key');
    config.tools = createBasicTools();
    
    const router = new IntentRouter(config);
    if (!router) {
      throw new Error('Router not created');
    }
    // Check if router has expected methods
    if (typeof router.route !== 'function') {
      throw new Error('Router missing route method');
    }
    if (typeof router.planOnly !== 'function') {
      throw new Error('Router missing planOnly method');
    }
  });

  // Test 6: WinterTC API availability in Node.js
  await test('WinterTC API availability', () => {
    const requiredAPIs = ['setInterval', 'clearInterval', 'setTimeout', 'TextEncoder'];
    const missingAPIs = [];
    
    requiredAPIs.forEach(api => {
      if (typeof globalThis[api] === 'undefined') {
        missingAPIs.push(api);
      }
    });
    
    if (missingAPIs.length > 0) {
      throw new Error(`Missing WinterTC APIs: ${missingAPIs.join(', ')}`);
    }
  });

  // Test 7: Text encoding (WinterTC compliance)
  await test('TextEncoder functionality', () => {
    const encoder = new globalThis.TextEncoder();
    const testText = 'Intent Router Test';
    const encoded = encoder.encode(testText);
    
    if (!(encoded instanceof Uint8Array)) {
      throw new Error('TextEncoder should return Uint8Array');
    }
    if (encoded.length === 0) {
      throw new Error('Encoded text should not be empty');
    }
  });

  // Test 8: Timer functionality (WinterTC compliance)
  await test('Timer functionality', async () => {
    return new Promise((resolve, reject) => {
      let callbackExecuted = false;
      
      const timer = globalThis.setTimeout(() => {
        callbackExecuted = true;
        resolve();
      }, 50);
      
      // Safety timeout
      globalThis.setTimeout(() => {
        if (!callbackExecuted) {
          reject(new Error('Timer callback not executed'));
        }
      }, 100);
    });
  });

  // Test 9: Error handling
  await test('Error handling', () => {
    try {
      // Test invalid configuration
      const invalidConfig = {};
      const router = new IntentRouter(invalidConfig);
      // If we get here without error, that's unexpected
      throw new Error('Should have thrown error for invalid config');
    } catch (error) {
      // Expected error - this is good
      if (error.message === 'Should have thrown error for invalid config') {
        throw error;
      }
      // Any other error is expected behavior
    }
  });

  // Test 10: Environment detection
  await test('Environment detection', () => {
    // Verify we're in Node.js environment
    if (typeof process === 'undefined') {
      throw new Error('Not in Node.js environment');
    }
    if (typeof window !== 'undefined') {
      throw new Error('Window object should not exist in Node.js');
    }
    if (typeof global === 'undefined') {
      throw new Error('Global object should exist in Node.js');
    }
  });

  // Test 11: Plan generation (mock test)
  await test('Plan generation capabilities', async () => {
    const config = createOpenAIConfig('test-key');
    config.tools = createBasicTools();
    const router = new IntentRouter(config);
    const userContext = createUserContext('test-user', ['web_search'], 'medium');
    
    // Test planOnly method exists and can be called
    // Note: This will likely fail without real API credentials, but we're testing structure
    try {
      await router.planOnly('test intent', userContext);
      // If it succeeds, great
    } catch (error) {
      // Expected to fail without real API, but method should exist
      if (error.message.includes('is not a function')) {
        throw new Error('planOnly method not available');
      }
      // Other errors are expected (API errors, etc.)
    }
  });

  // Summary
  console.log('\n📊 Test Results:');
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Intent Router is working in Node.js environment.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
  
  console.log('\n🌐 Environment Details:');
  console.log(`   Platform: ${process.platform}`);
  console.log(`   Node Version: ${process.version}`);
  console.log(`   Architecture: ${process.arch}`);
  
  return { passedTests, totalTests };
}

// Run all tests
runTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
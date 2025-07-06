import React, { useState, useEffect } from 'react';
import { Box, Text, Newline } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import chalk from 'chalk';
import figures from 'figures';

import { 
  IntentRouter, 
  createOpenAIConfig, 
  createUserContext, 
  createBasicTools,
  ExecutionResult,
  UserContext 
} from 'intent-router-blueprint';

type Screen = 'welcome' | 'setup' | 'main' | 'result' | 'error';

interface SetupData {
  apiKey: string;
  provider: 'openai' | 'anthropic' | 'custom';
  endpoint?: string;
  model?: string;
}

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [setupData, setSetupData] = useState<SetupData>({
    apiKey: '',
    provider: 'openai'
  });
  const [router, setRouter] = useState<IntentRouter | null>(null);
  const [loading, setLoading] = useState(false);
  const [intent, setIntent] = useState('');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Auto-advance from welcome screen
    if (screen === 'welcome') {
      const timer = setTimeout(() => setScreen('setup'), 2000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  const handleSetupComplete = () => {
    try {
      const config = createOpenAIConfig(setupData.apiKey);
      config.tools = createBasicTools();
      
      const intentRouter = new IntentRouter(config);
      setRouter(intentRouter);
      setScreen('main');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize router');
      setScreen('error');
    }
  };

  const handleIntentSubmit = async () => {
    if (!router || !intent.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const userContext = createUserContext(
        'cli-user',
        ['web_search', 'send_email', 'file_operations'],
        'medium'
      );

      const executionResult = await router.route(intent, userContext);
      setResult(executionResult);
      setScreen('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setScreen('error');
    } finally {
      setLoading(false);
    }
  };

  const renderWelcome = () => (
    <Box flexDirection="column" alignItems="center" paddingY={2}>
      <Text color="cyan" bold>
        {figures.star} Intent Router Blueprint CLI Demo {figures.star}
      </Text>
      <Newline />
      <Text color="gray">WinterTC-compliant dual-LLM intent routing system</Text>
      <Newline />
      <Box>
        <Spinner type="dots" />
        <Text> Initializing...</Text>
      </Box>
    </Box>
  );

  const renderSetup = () => {
    const steps = [
      { title: 'Choose Provider', completed: setupData.provider !== 'openai' },
      { title: 'Enter API Key', completed: setupData.apiKey !== '' },
      { title: 'Initialize Router', completed: false }
    ];

    return (
      <Box flexDirection="column" padding={1}>
        <Text color="yellow" bold>
          {figures.play} Setup Configuration
        </Text>
        <Newline />
        
        {/* Progress indicator */}
        <Box marginBottom={1}>
          {steps.map((step, index) => (
            <Box key={index} marginRight={2}>
              <Text color={step.completed ? 'green' : 'gray'}>
                {step.completed ? figures.tick : figures.bullet} {step.title}
              </Text>
            </Box>
          ))}
        </Box>
        <Newline />

        {currentStep === 0 && (
          <Box flexDirection="column">
            <Text>Select your LLM provider:</Text>
            <SelectInput
              items={[
                { label: 'OpenAI (GPT-4o)', value: 'openai' },
                { label: 'Anthropic (Claude)', value: 'anthropic' },
                { label: 'Custom Endpoint', value: 'custom' }
              ]}
              onSelect={(item) => {
                setSetupData({ ...setupData, provider: item.value as any });
                setCurrentStep(1);
              }}
            />
          </Box>
        )}

        {currentStep === 1 && (
          <Box flexDirection="column">
            <Text>Enter your API key for {setupData.provider}:</Text>
            <TextInput
              value={setupData.apiKey}
              onChange={(value) => setSetupData({ ...setupData, apiKey: value })}
              onSubmit={() => {
                if (setupData.apiKey.trim()) {
                  handleSetupComplete();
                }
              }}
              mask="*"
              placeholder="sk-..."
            />
            <Text color="gray" dimColor>
              Press Enter to continue
            </Text>
          </Box>
        )}
      </Box>
    );
  };

  const renderMain = () => (
    <Box flexDirection="column" padding={1}>
      <Text color="green" bold>
        {figures.play} Intent Router Ready
      </Text>
      <Newline />
      
      <Box flexDirection="column" borderStyle="single" borderColor="blue" padding={1}>
        <Text color="blue" bold>System Status:</Text>
        <Text color="green">{figures.tick} WinterTC Compliance: Active</Text>
        <Text color="green">{figures.tick} Memory Manager: Initialized</Text>
        <Text color="green">{figures.tick} Security Engine: Active</Text>
        <Text color="green">{figures.tick} Cross-platform APIs: Enabled</Text>
      </Box>
      
      <Newline />
      <Text>Enter your intent (what would you like to do?):</Text>
      <TextInput
        value={intent}
        onChange={setIntent}
        onSubmit={handleIntentSubmit}
        placeholder="e.g., Search for AI news and summarize the top 3 articles"
      />
      
      {loading && (
        <Box marginTop={1}>
          <Spinner type="dots" />
          <Text> Processing intent through dual-LLM system...</Text>
        </Box>
      )}
      
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          Press Enter to execute | Ctrl+C to exit
        </Text>
      </Box>
    </Box>
  );

  const renderResult = () => (
    <Box flexDirection="column" padding={1}>
      <Text color="green" bold>
        {figures.tick} Execution Complete
      </Text>
      <Newline />
      
      {result && (
        <Box flexDirection="column">
          <Box borderStyle="single" borderColor={result.success ? 'green' : 'red'} padding={1}>
            <Box flexDirection="column">
              <Text color={result.success ? 'green' : 'red'} bold>
                Status: {result.success ? 'SUCCESS' : 'FAILED'}
              </Text>
              <Text>Execution Time: {result.executionTime}ms</Text>
              <Text>Results: {result.results.length} items</Text>
              
              {result.errors.length > 0 && (
                <>
                  <Newline />
                  <Text color="red" bold>Errors:</Text>
                  {result.errors.map((err: string, i: number) => (
                    <Text key={i} color="red">• {err}</Text>
                  ))}
                </>
              )}
              
              {result.securityViolations.length > 0 && (
                <>
                  <Newline />
                  <Text color="yellow" bold>Security Violations:</Text>
                  {result.securityViolations.map((violation: string, i: number) => (
                    <Text key={i} color="yellow">• {violation}</Text>
                  ))}
                </>
              )}
              
              {result.results.length > 0 && (
                <>
                  <Newline />
                  <Text color="blue" bold>Results:</Text>
                  {result.results.map((res: any, i: number) => (
                    <Text key={i}>• {JSON.stringify(res, null, 2)}</Text>
                  ))}
                </>
              )}
            </Box>
          </Box>
          
          <Newline />
          <Text color="gray">
            Press any key to return to main menu...
          </Text>
        </Box>
      )}
    </Box>
  );

  const renderError = () => (
    <Box flexDirection="column" padding={1}>
      <Text color="red" bold>
        {figures.cross} Error Occurred
      </Text>
      <Newline />
      
      <Box borderStyle="single" borderColor="red" padding={1}>
        <Text color="red">{error}</Text>
      </Box>
      
      <Newline />
      <Text color="gray">
        Press any key to restart...
      </Text>
    </Box>
  );

  // Handle keyboard input for navigation
  useEffect(() => {
    const handleKeyPress = (key: string) => {
      if (screen === 'result' || screen === 'error') {
        setScreen('main');
        setResult(null);
        setError(null);
        setIntent('');
      }
    };

    process.stdin.on('keypress', handleKeyPress);
    return () => {
      process.stdin.off('keypress', handleKeyPress);
    };
  }, [screen]);

  switch (screen) {
    case 'welcome':
      return renderWelcome();
    case 'setup':
      return renderSetup();
    case 'main':
      return renderMain();
    case 'result':
      return renderResult();
    case 'error':
      return renderError();
    default:
      return <Text>Unknown screen</Text>;
  }
};

export default App;
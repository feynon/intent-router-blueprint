import { useState, useEffect, useCallback } from 'react';

interface OllamaStatus {
  connected: boolean;
  models: Array<{ name: string; size: number; modified_at: string }>;
  error: string | null;
  loading: boolean;
}

export function useOllamaStatus() {
  const [status, setStatus] = useState<OllamaStatus>({
    connected: false,
    models: [],
    error: null,
    loading: true,
  });

  const checkStatus = useCallback(async () => {
    setStatus(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Test basic connectivity
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      setStatus({
        connected: true,
        models: data.models || [],
        error: null,
        loading: false,
      });
    } catch (error) {
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to Ollama server. Is it running?';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'CORS not configured. Please restart Ollama with CORS enabled.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setStatus({
        connected: false,
        models: [],
        error: errorMessage,
        loading: false,
      });
    }
  }, []);

  useEffect(() => {
    checkStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, [checkStatus]);

  const hasRequiredModel = useCallback((modelName: string = 'qwen2.5:4b') => {
    return status.models.some(model => model.name.includes(modelName.split(':')[0]));
  }, [status.models]);

  return {
    ...status,
    checkStatus,
    hasRequiredModel,
  };
}
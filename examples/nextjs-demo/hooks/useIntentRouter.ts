import { useState, useCallback } from 'react';
import { ExecutionResult, ExecutionPlan } from 'intent-router-blueprint';

interface UseIntentRouterReturn {
  // State
  loading: boolean;
  planLoading: boolean;
  result: ExecutionResult | null;
  plan: ExecutionPlan | null;
  error: string | null;
  
  // Actions
  routeIntent: (intent: string, options?: RouteOptions) => Promise<void>;
  planOnly: (intent: string, options?: RouteOptions) => Promise<void>;
  clearResults: () => void;
}

interface RouteOptions {
  userId?: string;
  permissions?: string[];
  trustLevel?: 'low' | 'medium' | 'high';
}

export function useIntentRouter(): UseIntentRouterReturn {
  const [loading, setLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [plan, setPlan] = useState<ExecutionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const routeIntent = useCallback(async (intent: string, options: RouteOptions = {}) => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/intent-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent, ...options }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to route intent');
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const planOnly = useCallback(async (intent: string, options: RouteOptions = {}) => {
    setPlanLoading(true);
    setError(null);
    setPlan(null);
    
    try {
      const response = await fetch('/api/plan-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent, ...options }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate plan');
      }
      
      const data = await response.json();
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setPlanLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResult(null);
    setPlan(null);
    setError(null);
  }, []);

  return {
    loading,
    planLoading,
    result,
    plan,
    error,
    routeIntent,
    planOnly,
    clearResults,
  };
}
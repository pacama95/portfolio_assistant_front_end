import { useState, useEffect, useRef, useCallback } from 'react';
import type { InsightsResponse, AgentProgressEvent } from '../types/api';

interface UseInsightsStreamResult {
  insights: InsightsResponse | null;
  isStreaming: boolean;
  progress: AgentProgressEvent | null;
  error: string | null;
  startStream: (query: string, threadId?: string) => void;
  clearInsights: () => void;
  updates: { event: string; data: any }[];
}

const INSIGHTS_API_BASE_URL = import.meta.env.VITE_INSIGHTS_API_URL || 'http://localhost:8089';

export function useInsightsStream(): UseInsightsStreamResult {
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [progress, setProgress] = useState<AgentProgressEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [updates, setUpdates] = useState<{ event: string; data: any }[]>([]);

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const startStream = useCallback((query: string, threadId?: string) => {
    // Clean up any existing stream
    cleanup();

    setError(null);
    setProgress(null);
    setIsStreaming(true);
    setUpdates([]);

    // Use POST endpoint with fetch for SSE
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    fetch(`${INSIGHTS_API_BASE_URL}/insights/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        query,
        thread_id: threadId,
        use_case: 'portfolio_insights',
      }),
      signal: abortController.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No reader available');
        }

        let buffer = '';
        let currentEvent: string | null = null;

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            setIsStreaming(false);
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length === 0) {
              // End of one SSE event block
              currentEvent = null;
              continue;
            }

            if (trimmed.startsWith('event:')) {
              currentEvent = trimmed.substring(6).trim();
              continue;
            }

            if (trimmed.startsWith('data:')) {
              const data = trimmed.substring(5).trim();
              
              try {
                const parsed = JSON.parse(data);

                if (currentEvent === 'agent_event') {
                  // Check if this event has the new structure with phase and progress_percent
                  if (parsed.phase && parsed.progress_percent !== undefined) {
                    const agentEvent = parsed as AgentProgressEvent;
                    
                    // Update progress state
                    setProgress(agentEvent);
                    setUpdates((prev) => [...prev, { event: 'agent_event', data: agentEvent }]);
                    
                    // Check for final answer in complete phase
                    if (agentEvent.has_final_answer && agentEvent.final_answer) {
                      setInsights(agentEvent.final_answer);
                      setIsStreaming(false);
                      setUpdates((prev) => [...prev, { event: 'final', data: agentEvent.final_answer }]);
                    }
                    
                    // Handle error phase
                    if (agentEvent.phase === 'error') {
                      setError(agentEvent.message || 'Error during insight generation');
                      setIsStreaming(false);
                    }
                  }
                  // Legacy format compatibility: validator event with final answer
                  else if (parsed.node === 'validator' && parsed.status === 'result' && parsed.meta?.final_answer) {
                    try {
                      const finalInsights = JSON.parse(parsed.meta.final_answer) as InsightsResponse;
                      setInsights(finalInsights);
                      setIsStreaming(false);
                      setUpdates((prev) => [...prev, { event: 'final', data: finalInsights }]);
                    } catch (e) {
                      console.error('Failed to parse final_answer:', e);
                      setError('Failed to parse final insights');
                      setIsStreaming(false);
                    }
                  }
                  // Legacy format: progress event with summary
                  else if (parsed.summary) {
                    setUpdates((prev) => [...prev, { event: 'agent_event', data: parsed }]);
                  }
                } else if (currentEvent === 'error') {
                  setError(parsed?.message || 'Unknown error from stream');
                  setIsStreaming(false);
                  setUpdates((prev) => [...prev, { event: 'error', data: parsed }]);
                } else {
                  // Fallback for other event types
                  if (parsed?.version && parsed?.insights) {
                    setInsights(parsed as InsightsResponse);
                    setIsStreaming(false);
                    setUpdates((prev) => [...prev, { event: currentEvent || 'message', data: parsed }]);
                  }
                }
              } catch (e) {
                console.warn('Failed to parse SSE data:', data);
              }
            }
          }
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          console.log('Stream aborted');
        } else {
          console.error('Stream error:', err);
          setError(err.message || 'Failed to stream insights');
        }
        setIsStreaming(false);
      });
  }, [cleanup]);

  const clearInsights = useCallback(() => {
    setInsights(null);
    setProgress(null);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    insights,
    isStreaming,
    progress,
    error,
    startStream,
    clearInsights,
    updates,
  };
}

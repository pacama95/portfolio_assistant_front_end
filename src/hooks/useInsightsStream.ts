import { useState, useEffect, useRef, useCallback } from 'react';
import type { InsightsResponse, SseProgressEvent } from '../types/api';

interface UseInsightsStreamResult {
  insights: InsightsResponse | null;
  isStreaming: boolean;
  progress: SseProgressEvent | null;
  error: string | null;
  startStream: (query: string, threadId?: string) => void;
  clearInsights: () => void;
  updates: { event: string; data: any }[];
}

const INSIGHTS_API_BASE_URL = import.meta.env.VITE_INSIGHTS_API_URL || 'http://localhost:8089';

export function useInsightsStream(): UseInsightsStreamResult {
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [progress, setProgress] = useState<SseProgressEvent | null>(null);
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

                // Use explicit event type when available
                if (currentEvent === 'progress') {
                  setProgress(parsed as SseProgressEvent);
                  setUpdates((prev) => [...prev, { event: 'progress', data: parsed }]);
                } else if (currentEvent === 'final') {
                  setInsights(parsed as InsightsResponse);
                  setIsStreaming(false);
                  setUpdates((prev) => [...prev, { event: 'final', data: parsed }]);
                } else if (currentEvent === 'error') {
                  setError(parsed?.message || 'Unknown error from stream');
                  setIsStreaming(false);
                  setUpdates((prev) => [...prev, { event: 'error', data: parsed }]);
                } else {
                  // Fallback: infer from payload shape
                  if (parsed?.action) {
                    setProgress(parsed as SseProgressEvent);
                    setUpdates((prev) => [...prev, { event: currentEvent || 'message', data: parsed }]);
                  }
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

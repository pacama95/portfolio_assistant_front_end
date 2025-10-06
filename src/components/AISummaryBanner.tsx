import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Sparkles, ChevronRight, X, Loader2, Lightbulb, RefreshCcw } from 'lucide-react';
import { useInsightsStream } from '../hooks/useInsightsStream';
import type { InsightsResponse } from '../types/api';

const CACHE_KEY = 'portfolio_insights_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const THREAD_ID_KEY = 'portfolio_insights_thread_id';

interface CachedInsights {
  data: InsightsResponse;
  timestamp: number;
}

const iconMap = {
  performance: TrendingUp,
  alert: AlertCircle,
  risk: TrendingDown,
  opportunity: Lightbulb,
};

const colorMap = {
  performance: {
    icon: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  alert: {
    icon: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  risk: {
    icon: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  opportunity: {
    icon: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
};

const formatProgressAction = (action: string): string => {
  return action
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

export const AISummaryBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [cachedInsights, setCachedInsights] = useState<InsightsResponse | null>(null);
  const { insights, isStreaming, progress, error, startStream, clearInsights, updates } = useInsightsStream();
  const [threadId, setThreadId] = useState<string | null>(null);

  const genThreadId = (): string => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `thread_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  };

  // Initialize or load thread_id
  useEffect(() => {
    const stored = localStorage.getItem(THREAD_ID_KEY);
    if (stored) {
      setThreadId(stored);
    } else {
      const newId = genThreadId();
      localStorage.setItem(THREAD_ID_KEY, newId);
      setThreadId(newId);
    }
  }, []);

  // Load cached insights and start SSE after threadId is ready
  useEffect(() => {
    if (!threadId) return;
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed: CachedInsights = JSON.parse(cached);
        const now = Date.now();
        if (now - parsed.timestamp < CACHE_DURATION) {
          setCachedInsights(parsed.data);
          return;
        } else {
          localStorage.removeItem(CACHE_KEY);
        }
      } catch (e) {
        console.error('Failed to parse cached insights:', e);
        localStorage.removeItem(CACHE_KEY);
      }
    }
    // Fetch fresh insights with thread id
    startStream('Generate today\'s portfolio insights', threadId);
  }, [threadId]);

  // Cache insights when they arrive
  useEffect(() => {
    if (insights) {
      const cacheData: CachedInsights = {
        data: insights,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      setCachedInsights(insights);
    }
  }, [insights]);

  const displayInsights = cachedInsights || insights;

  const handleRefresh = () => {
    // Rotate thread id, invalidate cache, and re-stream
    const newId = genThreadId();
    localStorage.setItem(THREAD_ID_KEY, newId);
    setThreadId(newId);
    localStorage.removeItem(CACHE_KEY);
    setCachedInsights(null);
    clearInsights();
    setIsMinimized(false);
    setIsExpanded(false);
    startStream('Generate today\'s portfolio insights', newId);
  };

  // If minimized, show only the main icon button to reopen
  if (isMinimized) {
    return (
      <div className="w-full max-w-6xl mx-auto mb-6">
        <button
          onClick={() => setIsMinimized(false)}
          title="Open AI Portfolio Summary"
          className="p-0 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            {isStreaming ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 text-white" />
            )}
          </div>
        </button>
      </div>
    );
  }

  // Note: keep banner visible during streaming, even before insights arrive

  // Show error state
  if (error && !displayInsights) {
    return (
      <div className="w-full max-w-6xl mx-auto mb-6">
        <div className="rounded-lg border-2 border-red-200 bg-red-50 shadow-sm overflow-hidden">
          <div className="p-4 flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Failed to load insights</h3>
              <p className="text-sm text-gray-700">{error}</p>
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasInsights = !!displayInsights && displayInsights.insights.length > 0;
  const sortedInsights = hasInsights
    ? [...displayInsights!.insights].sort((a, b) => a.priority - b.priority)
    : [];
  const mainInsight = hasInsights ? sortedInsights[0] : null;
  const MainIcon = mainInsight ? iconMap[mainInsight.type] : Loader2;
  const mainColors = mainInsight ? colorMap[mainInsight.type] : { icon: 'text-purple-600' } as any;

  return (
    <div className="w-full max-w-6xl mx-auto mb-6">
      <div className={`rounded-lg border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 shadow-sm overflow-hidden transition-all duration-300 ${isExpanded ? 'pb-4' : ''}`}>
        {/* Main Banner */}
        <div className="p-4 flex items-start gap-4">
          {/* AI Icon */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              {hasInsights ? (
                <Sparkles className="w-5 h-5 text-white" />
              ) : (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-gray-900">AI Portfolio Summary</h3>
              {hasInsights ? (
                <span className="text-xs text-gray-500">· {formatTimeAgo(displayInsights!.generated_at_utc)}</span>
              ) : (
                <span className="text-xs text-gray-500">· Generating insights...</span>
              )}
            </div>
            
            <div className="flex items-start gap-3">
              <MainIcon className={`w-5 h-5 ${mainColors.icon} flex-shrink-0 mt-0.5`} />
              {hasInsights ? (
                <p className="text-base text-gray-700 leading-relaxed">
                  {mainInsight!.summary}
                  {sortedInsights.length > 1 && !isExpanded && (
                    <span className="text-gray-500"> · {sortedInsights.length - 1} more insight{sortedInsights.length > 2 ? 's' : ''}</span>
                  )}
                </p>
              ) : (
                <div className="text-sm text-gray-700 leading-relaxed">
                  <p>We are generating your portfolio insights. This may take a few seconds.</p>
                  {progress && (
                    <p className="mt-1 text-gray-600">
                      Current step: {formatProgressAction(progress.action)}
                      {progress.subject && <span className="text-purple-600 ml-1">({progress.subject})</span>}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Live Progress Updates (only while streaming and before final insights) */}
            {isStreaming && !hasInsights && (
              <div className="mt-3 bg-white/60 border border-purple-100 rounded-lg p-3 max-h-40 overflow-auto">
                <div className="text-xs font-semibold text-gray-700 mb-2">Live progress</div>
                <ul className="space-y-1">
                  {updates.slice(-12).map((u, idx) => (
                    <li key={idx} className="text-xs text-gray-700">
                      <span className="font-medium text-purple-700">{u.event}</span>
                      {u.event === 'progress' && u.data?.action && (
                        <span className="ml-1">{formatProgressAction(u.data.action)}{u.data?.subject ? ` (${u.data.subject})` : ''}</span>
                      )}
                      {u.event === 'error' && (
                        <span className="ml-1 text-red-600">{u.data?.message || 'Stream error'}</span>
                      )}
                      {u.event !== 'progress' && u.event !== 'error' && u.event !== 'final' && (
                        <span className="ml-1 text-gray-600">{JSON.stringify(u.data)}</span>
                      )}
                      {u.event === 'final' && (
                        <span className="ml-1 text-green-700">Final insights ready</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleRefresh}
              className="px-2 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-100 rounded-md transition-colors flex items-center gap-1"
              title="Refresh insights"
            >
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </button>
            {hasInsights && sortedInsights.length > 1 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-100 rounded-md transition-colors flex items-center gap-1"
              >
                {isExpanded ? 'Show Less' : 'View All Insights'}
                <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>
            )}
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded Insights */}
        {hasInsights && isExpanded && (
          <div className="px-4 space-y-3">
            {sortedInsights.map((insight, index) => {
              const Icon = iconMap[insight.type];
              const colors = colorMap[insight.type];
              return (
                <div
                  key={index}
                  className={`${colors.bg} rounded-lg p-4 border ${colors.border}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 ${colors.icon} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                      <p className="text-sm text-gray-700 mb-2">{insight.summary}</p>
                      <p className="text-xs text-gray-600">{insight.details}</p>
                      
                      {/* Key Numbers */}
                      {insight.key_numbers && insight.key_numbers.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-3">
                          {insight.key_numbers.map((keyNum, idx) => (
                            <div key={idx} className="bg-white/50 rounded px-2 py-1">
                              <span className="text-xs text-gray-600">{keyNum.label}: </span>
                              <span className="text-sm font-semibold text-gray-900">
                                {keyNum.value}{keyNum.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

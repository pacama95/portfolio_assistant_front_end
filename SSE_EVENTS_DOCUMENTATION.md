# SSE Events Documentation

**Version**: 4.0  
**Last Updated**: 2026-01-11

## Overview

The Portfolio Insights Agent streams real-time progress updates via Server-Sent Events (SSE) during insight generation. This document provides the complete event format specification and examples for implementing the client-side GUI.

**Architecture**: The agent now uses a **per-insight pipeline** architecture where each position flows through its own complete pipeline (cache_check → refiner → assistant → judge → emit_result), enabling progressive streaming and ~40-45% latency reduction.

---

## Event Types

The agent emits **two types of events**:

### 1. Progress Events (`agent_event`)

Track overall pipeline progress:

```
event: agent_event
data: {JSON_PAYLOAD}
```

### 2. Insight Complete Events (`insight_complete`)

Stream individual insights as they complete (NEW in v4.0):

```
event: insight_complete
data: {JSON_PAYLOAD}
```

**Key Benefit**: Clients can display insights **immediately** as each pipeline completes, without waiting for the entire process to finish.

---

## Event Payload Structures

### Progress Event Payload (`agent_event`)

```typescript
interface ProgressEvent {
  // Pipeline phase
  phase: "initializing" | "data_fetching" | "insight_pipeline" | 
         "streaming_collector" | "composition" | "validation" | 
         "complete" | "error";
  
  // Event status
  status: "started" | "in_progress" | "completed" | "skipped" | "error";
  
  // Human-readable message
  message: string;
  
  // Overall progress (0-100)
  progress_percent: number;
  
  // Current node in the graph
  node: string;
  
  // Step tracking
  step_current: number;
  step_total: number;
  
  // Unix timestamp
  timestamp: number;
  
  // Additional metadata (varies by phase)
  details: {
    phase_name?: string;
    positions_count?: number;
    tickers?: string[];
    pipelines_total?: number;
    pipelines_completed?: number;
    ticker?: string;
    status?: "cached" | "accepted" | "rejected" | "skipped";
    cache_hits?: number;
    insights_count?: number;
    insight_types?: string[];
    final_count?: number;
  };
  
  // Final answer (only on completion)
  final_answer?: {
    version: string;
    generated_at_utc: string;
    insights: Insight[];
  };
  
  // Indicates if final_answer is present
  has_final_answer?: boolean;
}
```

### Insight Complete Event Payload (`insight_complete`)

```typescript
interface InsightCompleteEvent {
  // Ticker symbol
  ticker: string;
  
  // Pipeline completion status
  status: "cached" | "accepted" | "rejected" | "skipped";
  
  // Full insight JSON (null if rejected/skipped)
  insight: Insight | null;
  
  // Judge verdict (only for accepted/rejected)
  verdict?: {
    verdict: "ACCEPT" | "REJECT";
    confidence_score: number;
    feedback: string;
  };
  
  // Unix timestamp
  timestamp: number;
}

interface Insight {
  task_id: string;
  ticker: string;
  insight_type: "performance" | "alert" | "risk" | "opportunity";
  status: "complete";
  summary: string;
  details: string;
  key_numbers: Array<{
    label: string;
    value: string;
    change?: string;
  }>;
  sources: string[];
  natural_content?: string;
  use_case: string;
}
```

---

## Phase Progression

The pipeline progresses through these phases in order:

1. **initializing** - Starting up
2. **data_fetching** - Fetching portfolio positions
3. **insight_pipeline** - Per-position parallel pipelines (cache_check → refiner → assistant → judge → emit_result)
4. **streaming_collector** - Collecting completed pipeline results
5. **composition** - Deduplicating and prioritizing insights
6. **validation** - Final validation
7. **complete** - Done!

**Note**: Each insight pipeline runs independently and includes its own cache checking and storage. Results stream progressively as each pipeline completes.

---

## Example Events

### 1. Data Fetching Phase

```json
{
  "event": "agent_event",
  "data": {
    "phase": "data_fetching",
    "status": "in_progress",
    "message": "Fetched 3 positions: AAPL, GOOGL, MSFT",
    "progress_percent": 5.0,
    "node": "data_fetcher",
    "step_current": 1,
    "step_total": 14,
    "timestamp": 1736035200.123,
    "details": {
      "phase_name": "Fetching Portfolio Data",
      "positions_count": 3,
      "tickers": ["AAPL", "GOOGL", "MSFT"]
    }
  }
}
```

**GUI Suggestion**: Display ticker list, show "Fetching data..." with spinner

---

### 2. Insight Pipeline Dispatch

```json
{
  "event": "agent_event",
  "data": {
    "phase": "insight_pipeline",
    "status": "started",
    "message": "Starting 3 parallel insight pipelines",
    "progress_percent": 15.0,
    "node": "insight_pipeline",
    "step_current": 2,
    "step_total": 7,
    "timestamp": 1736035201.456,
    "details": {
      "phase_name": "Processing Insights",
      "pipelines_total": 3,
      "tickers": ["AAPL", "GOOGL", "MSFT"]
    }
  }
}
```

**GUI Suggestion**: Show "Processing 3 positions in parallel..." with ticker badges

---

### 3. Individual Pipeline Completion (Progressive Streaming)

#### 3a. Cache Hit (Fast Path)

```json
{
  "event": "agent_event",
  "data": {
    "phase": "insight_pipeline",
    "status": "in_progress",
    "message": "AAPL: Used cached insight (1/3)",
    "progress_percent": 30.0,
    "node": "insight_pipeline",
    "step_current": 3,
    "step_total": 7,
    "timestamp": 1736035202.789,
    "details": {
      "phase_name": "Processing Insights",
      "ticker": "AAPL",
      "status": "cached",
      "pipelines_completed": 1,
      "pipelines_total": 3
    }
  }
}
```

**GUI Suggestion**: Show "✓ AAPL (cached)" with instant completion animation

#### 3b. Generated & Accepted

```json
{
  "event": "agent_event",
  "data": {
    "phase": "insight_pipeline",
    "status": "in_progress",
    "message": "GOOGL: Insight accepted (2/3)",
    "progress_percent": 55.0,
    "node": "insight_pipeline",
    "step_current": 3,
    "step_total": 7,
    "timestamp": 1736035215.345,
    "details": {
      "phase_name": "Processing Insights",
      "ticker": "GOOGL",
      "status": "accepted",
      "pipelines_completed": 2,
      "pipelines_total": 3
    }
  }
}
```

**GUI Suggestion**: Show "✓ GOOGL (generated)" with typing animation then checkmark

#### 3c. Rejected or Skipped

```json
{
  "event": "agent_event",
  "data": {
    "phase": "insight_pipeline",
    "status": "in_progress",
    "message": "MSFT: Insight skipped (3/3)",
    "progress_percent": 80.0,
    "node": "insight_pipeline",
    "step_current": 3,
    "step_total": 7,
    "timestamp": 1736035230.678,
    "details": {
      "phase_name": "Processing Insights",
      "ticker": "MSFT",
      "status": "skipped",
      "pipelines_completed": 3,
      "pipelines_total": 3
    }
  }
}
```

**GUI Suggestion**: Show "○ MSFT (skipped)" with subtle gray indicator

---

### 3.d. Insight Complete Events (Progressive Display)

As each pipeline completes, an `insight_complete` event is emitted with the **full insight JSON**:

#### Cached Insight

```json
{
  "event": "insight_complete",
  "data": {
    "ticker": "AAPL",
    "status": "cached",
    "insight": {
      "task_id": "aapl_performance_001",
      "ticker": "AAPL",
      "insight_type": "performance",
      "status": "complete",
      "summary": "Apple position gained $27,179 (169%) since purchase",
      "details": "The position has delivered exceptional returns...",
      "key_numbers": [
        {"label": "Total Gain", "value": "$27,179", "change": "+169%"},
        {"label": "Portfolio Weight", "value": "24%"}
      ],
      "sources": ["portfolio_data", "market_data"],
      "use_case": "portfolio_insights"
    },
    "timestamp": 1736035202.789
  }
}
```

#### Generated & Accepted Insight

```json
{
  "event": "insight_complete",
  "data": {
    "ticker": "GOOGL",
    "status": "accepted",
    "insight": {
      "task_id": "googl_alert_001",
      "ticker": "GOOGL",
      "insight_type": "alert",
      "status": "complete",
      "summary": "Google stock down 8% this week on regulatory concerns",
      "details": "Recent antitrust developments have created volatility...",
      "key_numbers": [
        {"label": "Week Change", "value": "-8.2%"},
        {"label": "Position Impact", "value": "-$3,420"}
      ],
      "sources": ["market_data", "news_data"],
      "use_case": "portfolio_insights"
    },
    "verdict": {
      "verdict": "ACCEPT",
      "confidence_score": 8,
      "feedback": "High-quality insight with specific data and clear impact"
    },
    "timestamp": 1736035215.345
  }
}
```

#### Rejected Insight

```json
{
  "event": "insight_complete",
  "data": {
    "ticker": "MSFT",
    "status": "rejected",
    "insight": {
      "task_id": "msft_risk_001",
      "ticker": "MSFT",
      "insight_type": "risk",
      "summary": "Microsoft position carries moderate risk",
      "details": "Generic risk assessment without specific concerns..."
    },
    "verdict": {
      "verdict": "REJECT",
      "confidence_score": 3,
      "feedback": "Too generic, lacks specific actionable information"
    },
    "timestamp": 1736035230.678
  }
}
```

**GUI Suggestion**: 
- **Cached/Accepted**: Display insight card immediately with full content
- **Rejected**: Show in debug panel or skip display
- **Skipped**: No insight to display

---

### 4. Streaming Collector Phase

```json
{
  "event": "agent_event",
  "data": {
    "phase": "streaming_collector",
    "status": "in_progress",
    "message": "Collected 2 insights from 3 pipelines",
    "progress_percent": 85.0,
    "node": "streaming_collector",
    "step_current": 4,
    "step_total": 7,
    "timestamp": 1736035230.678,
    "details": {
      "phase_name": "Collecting Results",
      "cache_hits": 1,
      "insights_count": 2
    }
  }
}
```

**GUI Suggestion**: Show "Collecting results..." (brief transition phase)

---

### 5. Composition Phase

```json
{
  "event": "agent_event",
  "data": {
    "phase": "composition",
    "status": "in_progress",
    "message": "Composed 2 final insights",
    "progress_percent": 90.0,
    "node": "composer",
    "step_current": 5,
    "step_total": 7,
    "timestamp": 1736035242.456,
    "details": {
      "phase_name": "Composing Results",
      "insights_count": 2,
      "insight_types": ["performance", "alert"]
    }
  }
}
```

**GUI Suggestion**: Show "Finalizing 2 insights..." with insight type badges

---

### 6. Validation & Completion

```json
{
  "event": "agent_event",
  "data": {
    "phase": "complete",
    "status": "completed",
    "message": "Validated 2 insights",
    "progress_percent": 100.0,
    "node": "validator",
    "step_current": 7,
    "step_total": 7,
    "timestamp": 1736035243.789,
    "details": {
      "phase_name": "Complete",
      "final_count": 2
    },
    "final_answer": {
      "version": "1.0",
      "generated_at_utc": "2026-01-05T00:00:43+00:00",
      "insights": [
        {
          "insight_type": "performance",
          "ticker": "AAPL",
          "summary": "Apple position gained $27,179 (169%) since purchase, now 24% of portfolio.",
          "details": "The position has delivered exceptional returns reflecting Apple's strong product cycle and recent earnings beat. However, the 24% portfolio concentration creates risk.",
          "key_numbers": [
            {"label": "Unrealized Gain", "value": 27179, "unit": "$"},
            {"label": "Return", "value": 169.02, "unit": "%"},
            {"label": "Portfolio Weight", "value": 24.1, "unit": "%"}
          ]
        }
        // ... more insights
      ]
    },
    "has_final_answer": true
  }
}
```

**GUI Suggestion**: 
- Show "✓ Complete!" with success animation
- Transition to displaying the insights
- Close the progress modal/overlay

---

## Error Handling

### Error Event

```json
{
  "event": "agent_event",
  "data": {
    "phase": "error",
    "status": "error",
    "message": "Failed to generate insights: API rate limit exceeded",
    "progress_percent": 45.0,
    "node": "assistant_worker",
    "step_current": 7,
    "step_total": 14,
    "timestamp": 1736035220.123,
    "details": {
      "phase_name": "Error"
    }
  }
}
```

**GUI Suggestion**: Show error modal with retry button

---

## Client Implementation Guide

### JavaScript/TypeScript Example

```typescript
interface ProgressEvent {
  phase: string;
  status: string;
  message: string;
  progress_percent: number;
  node: string;
  step_current: number;
  step_total: number;
  timestamp: number;
  details: Record<string, any>;
  final_answer?: any;
  has_final_answer?: boolean;
}

function connectToInsightsStream(query: string, useCase: string = 'portfolio_insights') {
  const url = new URL('/insights/stream', 'http://localhost:8080');
  url.searchParams.set('query', query);
  url.searchParams.set('use_case', useCase);
  
  const eventSource = new EventSource(url.toString());
  
  // Listen for progress updates
  eventSource.addEventListener('agent_event', (event) => {
    const data: ProgressEvent = JSON.parse(event.data);
    
    // Update progress bar
    updateProgressBar(data.progress_percent);
    
    // Update status message
    updateStatusMessage(data.message);
    
    // Update phase indicator
    updatePhaseIndicator(data.phase);
    
    // Handle completion
    if (data.has_final_answer) {
      eventSource.close();
    }
    
    // Log for debugging
    console.log(`[${data.phase}] ${data.message} (${data.progress_percent}%)`);
  });
  
  // Listen for individual insight completions (NEW in v4.0)
  eventSource.addEventListener('insight_complete', (event) => {
    const data = JSON.parse(event.data);
    
    // Display insight immediately as it completes!
    if (data.status === 'cached' || data.status === 'accepted') {
      displayInsightCard(data.insight, data.ticker, data.status);
      console.log(`✓ ${data.ticker} insight ready (${data.status})`);
    }
    
    // Optional: Log rejected insights for debugging
    if (data.status === 'rejected') {
      console.warn(`✗ ${data.ticker} rejected:`, data.verdict?.feedback);
    }
  });
  
  eventSource.onerror = (error) => {
    console.error('SSE error:', error);
    eventSource.close();
    showErrorMessage('Connection lost. Please try again.');
  };
  
  return eventSource;
}

function updateProgressBar(percent: number) {
  const progressBar = document.getElementById('progress-bar');
  if (progressBar) {
    progressBar.style.width = `${percent}%`;
    progressBar.setAttribute('aria-valuenow', percent.toString());
  }
}

function updateStatusMessage(message: string) {
  const statusEl = document.getElementById('status-message');
  if (statusEl) {
    statusEl.textContent = message;
  }
}

function updatePhaseIndicator(phase: string) {
  // Update visual phase indicator (e.g., stepper component)
  const phases = [
    'data_fetching',
    'insight_pipeline',
    'streaming_collector',
    'composition',
    'validation'
  ];
  
  const currentIndex = phases.indexOf(phase);
  phases.forEach((p, index) => {
    const el = document.getElementById(`phase-${p}`);
    if (el) {
      el.classList.toggle('active', index === currentIndex);
      el.classList.toggle('completed', index < currentIndex);
    }
  });
}
```

### React Example

```tsx
import { useState, useEffect } from 'react';

interface ProgressEvent {
  phase: string;
  status: string;
  message: string;
  progress_percent: number;
  details: Record<string, any>;
  final_answer?: any;
  has_final_answer?: boolean;
}

export function InsightsProgress({ query, useCase = 'portfolio_insights' }) {
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    const url = new URL('/insights/stream', 'http://localhost:8080');
    url.searchParams.set('query', query);
    url.searchParams.set('use_case', useCase);
    
    const eventSource = new EventSource(url.toString());
    
    eventSource.addEventListener('agent_event', (event) => {
      const data: ProgressEvent = JSON.parse(event.data);
      setProgress(data);
      
      if (data.has_final_answer && data.final_answer) {
        setInsights(data.final_answer.insights);
        setIsComplete(true);
        eventSource.close();
      }
    });
    
    return () => eventSource.close();
  }, [query, useCase]);
  
  if (isComplete) {
    return <InsightsList insights={insights} />;
  }
  
  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${progress?.progress_percent || 0}%` }}
        />
      </div>
      
      <div className="status-message">
        {progress?.message || 'Initializing...'}
      </div>
      
      <div className="phase-indicator">
        Phase: {progress?.details?.phase_name || 'Starting'}
      </div>
      
      {progress?.details?.cache_hits !== undefined && (
        <div className="cache-info">
          ✓ {progress.details.cache_hits} from cache, 
          generating {progress.details.cache_misses} new
        </div>
      )}
    </div>
  );
}
```

---

## UI/UX Recommendations

### Recommended UI Flow

1. **Progress Bar**: Use `progress_percent` from `agent_event` for overall progress (0-100%)
2. **Phase Stepper**: Show all phases with current one highlighted
3. **Status Message**: Display `message` field prominently
4. **Insight Cards**: Display insights **immediately** as `insight_complete` events arrive
5. **Progressive Loading**: Show insights appearing one-by-one as pipelines complete

### Example: Progressive Insight Display

```typescript
const insightsContainer = document.getElementById('insights-container');

eventSource.addEventListener('insight_complete', (event) => {
  const { insight, ticker, status } = JSON.parse(event.data);
  
  if (status === 'cached' || status === 'accepted') {
    // Create and append insight card immediately
    const card = createInsightCard(insight, status === 'cached');
    insightsContainer.appendChild(card);
    
    // Animate card entrance
    card.classList.add('fade-in');
    
    // Show badge for cached insights
    if (status === 'cached') {
      card.querySelector('.badge').textContent = '⚡ Cached';
    }
  }
});
```

### Phase-Specific UI Elements

- **Data Fetching**: Show ticker list from `details.tickers`
- **Insight Pipeline**: Show per-ticker progress with real-time status updates (cached/accepted/rejected/skipped)
  - Use `details.ticker` and `details.status` to show individual pipeline completion
  - Display `pipelines_completed / pipelines_total` for overall progress
- **Streaming Collector**: Brief transition, show cache hit count
- **Composition**: Show final insight count and types
- **Completion**: Smooth transition to insights display

### Performance Tips

1. **Debounce Updates**: Update UI at most every 100ms to avoid jank
2. **Animate Smoothly**: Use CSS transitions for progress bar
3. **Optimize Renders**: Only re-render when `progress_percent` or `message` changes
4. **Handle Reconnection**: Implement automatic reconnection on connection loss

---

## Testing

### Test with curl

```bash
curl -N "http://localhost:8080/insights/stream?query=Generate%20insights&use_case=portfolio_insights"
```

### Expected Timeline

- **Full cache hit**: ~1-2 seconds total (instant from cache)
  - All `insight_complete` events arrive within 1-2 seconds
- **Partial cache hit**: ~15-30 seconds total
  - Cached insights arrive in 1-2 seconds
  - Generated insights stream progressively as they complete
- **Full cache miss**: ~30-60 seconds for 3 positions (40-45% faster than old architecture)
  - Insights appear progressively, fastest ones complete in ~15-20 seconds

**Key Advantage**: With the new per-insight pipeline architecture and `insight_complete` events:
- Cached insights appear **instantly** (1-2 seconds)
- Generated insights appear **as soon as they complete** (not waiting for all to finish)
- Users see results progressively, dramatically improving perceived performance
- No need to wait for `final_answer` to display insights

---

## Support

For questions or issues, refer to:
- API Documentation: `/openapi.yaml`
- Use Cases Endpoint: `GET /use-cases`
- Health Check: `GET /health`

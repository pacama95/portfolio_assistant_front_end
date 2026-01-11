import React from 'react';
import { CheckCircle2, Clock, XCircle, Circle } from 'lucide-react';
import type { PipelineStatus } from '../types/api';

interface PipelineItem {
  ticker: string;
  status: PipelineStatus | 'processing' | null;
  timestamp?: number;
}

interface PipelineTrackerProps {
  pipelines: Map<string, PipelineItem>;
  totalExpected?: number;
}

export const PipelineTracker: React.FC<PipelineTrackerProps> = ({ 
  pipelines, 
  totalExpected 
}) => {
  const items = Array.from(pipelines.values());
  const completed = items.filter(p => p.status && p.status !== 'processing').length;
  
  const getStatusIcon = (status: PipelineStatus | 'processing' | null) => {
    switch (status) {
      case 'cached':
      case 'accepted':
        return <CheckCircle2 className="w-3 h-3 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-3 h-3 text-red-600" />;
      case 'skipped':
        return <Circle className="w-3 h-3 text-gray-400" />;
      case 'processing':
        return <Clock className="w-3 h-3 text-purple-600 animate-pulse" />;
      default:
        return <Circle className="w-3 h-3 text-gray-300" />;
    }
  };

  const getStatusColor = (status: PipelineStatus | 'processing' | null): string => {
    switch (status) {
      case 'cached':
      case 'accepted':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'rejected':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'skipped':
        return 'bg-gray-50 border-gray-200 text-gray-600';
      case 'processing':
        return 'bg-purple-50 border-purple-200 text-purple-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-500';
    }
  };

  const getStatusLabel = (status: PipelineStatus | 'processing' | null): string => {
    switch (status) {
      case 'cached':
      case 'accepted':
        return 'ready';
      case 'rejected':
        return 'failed';
      case 'skipped':
        return 'skipped';
      case 'processing':
        return 'processing';
      default:
        return 'pending';
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span className="font-medium">Processing Positions</span>
        <span>{completed}/{totalExpected || items.length} completed</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <div
            key={item.ticker}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium transition-all ${getStatusColor(item.status)}`}
          >
            {getStatusIcon(item.status)}
            <span>{item.ticker}</span>
            <span className="text-[10px] opacity-70">
              {getStatusLabel(item.status)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

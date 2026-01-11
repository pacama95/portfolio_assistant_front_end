import React from 'react';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import type { AgentPhase } from '../types/api';

interface PhaseIndicatorProps {
  currentPhase: AgentPhase;
  currentStep: number;
  totalSteps: number;
}

interface PhaseInfo {
  key: AgentPhase;
  label: string;
  description: string;
}

const phases: PhaseInfo[] = [
  { key: 'initializing', label: 'Initialize', description: 'Starting up' },
  { key: 'data_fetching', label: 'Fetch Data', description: 'Loading portfolio' },
  { key: 'insight_pipeline', label: 'Process', description: 'Generating insights' },
  { key: 'streaming_collector', label: 'Collect', description: 'Gathering results' },
  { key: 'composition', label: 'Compose', description: 'Finalizing' },
  { key: 'validation', label: 'Validate', description: 'Quality check' },
  { key: 'complete', label: 'Complete', description: 'Done!' },
];

export const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({ 
  currentPhase, 
  currentStep, 
  totalSteps 
}) => {
  const currentPhaseIndex = phases.findIndex(p => p.key === currentPhase);
  const isError = currentPhase === 'error';

  const getPhaseStatus = (index: number): 'completed' | 'current' | 'pending' | 'error' => {
    if (isError && index === currentPhaseIndex) return 'error';
    if (index < currentPhaseIndex) return 'completed';
    if (index === currentPhaseIndex) return 'current';
    return 'pending';
  };

  const getIcon = (status: 'completed' | 'current' | 'pending' | 'error') => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'current':
        return <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Circle className="w-4 h-4 text-gray-300" />;
    }
  };

  return (
    <div className="w-full">
      {/* Mobile: Compact view */}
      <div className="md:hidden">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-gray-700">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-gray-500">
            {phases[currentPhaseIndex]?.label || currentPhase}
          </span>
        </div>
      </div>

      {/* Desktop: Full phase stepper */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {phases.map((phase, index) => {
            const status = getPhaseStatus(index);
            const isLast = index === phases.length - 1;

            return (
              <React.Fragment key={phase.key}>
                <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getIcon(status)}
                  </div>
                  <div className="text-center">
                    <div className={`text-xs font-medium ${
                      status === 'current' ? 'text-purple-700' :
                      status === 'completed' ? 'text-green-700' :
                      status === 'error' ? 'text-red-700' :
                      'text-gray-400'
                    }`}>
                      {phase.label}
                    </div>
                    {status === 'current' && (
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {phase.description}
                      </div>
                    )}
                  </div>
                </div>
                {!isLast && (
                  <div className={`h-0.5 flex-1 mx-1 ${
                    status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

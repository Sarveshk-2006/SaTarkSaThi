import React from 'react';
import { Shield, Sparkles, AlertCircle } from 'lucide-react';
import { useDemoMode } from '../../context/DemoModeContext';

export const DemoModeIndicator: React.FC = () => {
  const { isBackendConnected, isDemoMode, activeProvider } = useDemoMode();

  return (
    <div className="flex items-center gap-2 text-xs">
      {/* Backend Status */}
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-medium ${
          isBackendConnected
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-amber-50 text-amber-800 border-amber-200'
        }`}
        title={
          isBackendConnected
            ? 'FastAPI SQLite backend online'
            : 'Backend disconnected; check local server'
        }
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isBackendConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
          }`}
        />
        <span>{isBackendConnected ? 'Backend Online' : 'Connecting...'}</span>
      </div>

      {/* Demo / Seed Mode Indicator */}
      {isDemoMode && (
        <div
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border bg-slate-100 text-slate-700 border-slate-200 font-medium"
          title="Demo dataset active with verified sample incidents"
        >
          <Shield className="w-3 h-3 text-slate-500" />
          <span>Demo Data</span>
        </div>
      )}

      {/* Analysis Engine Indicator (honest: the default is the local rule engine) */}
      <div
        className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-md border bg-teal-50 text-teal-800 border-teal-200 font-medium"
        title={
          activeProvider === 'watsonx'
            ? 'IBM watsonx.ai selected; used only when credentials are configured, otherwise the rule engine runs'
            : 'Local deterministic rule engine (no IBM service is called)'
        }
      >
        <Sparkles className="w-3 h-3 text-teal-600" />
        <span>{activeProvider === 'watsonx' ? 'watsonx.ai selected' : 'Rule Engine'}</span>
      </div>
    </div>
  );
};

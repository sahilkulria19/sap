import React from 'react';
import { AlertOctagon, HelpCircle, Code, Server, Key } from 'lucide-react';

export default function ErrorState({ error, message, isConfigError, onRetry }) {
  return (
    <div className="relative z-10 glass-panel border border-red-950/80 bg-red-950/20 p-6 rounded-2xl shadow-glow-danger max-w-2xl mx-auto my-8 no-print">
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <AlertOctagon className="w-6 h-6 text-red-400" />
        </div>
        
        <div className="space-y-3 flex-1">
          <h3 className="text-lg font-bold font-display text-red-200">
            {error || "Generation Error"}
          </h3>
          <p className="text-sm text-red-300/90 leading-relaxed">
            {message || "An unexpected error occurred while communicating with the server."}
          </p>

          {isConfigError && (
            <div className="mt-4 bg-[#140e1e] border border-red-900/60 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-red-400 uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>How to fix this issue:</span>
              </div>
              
              <ol className="text-xs text-sap-text space-y-2.5 list-decimal list-inside pl-1">
                <li>
                  Go to <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-sap-cyan underline font-semibold">Google AI Studio</a> and generate a free API Key.
                </li>
                <li>
                  Open the backend env file:
                  <code className="block mt-1 p-2 bg-sap-dark rounded border border-sap-border text-sap-cyan font-mono text-[10px] break-all">
                    sap-mentor-ai/server/.env
                  </code>
                </li>
                <li>
                  Add your copied API key:
                  <code className="block mt-1 p-2 bg-sap-dark rounded border border-sap-border text-sap-cyan font-mono text-[10px]">
                    GEMINI_API_KEY=AIzaSy...
                  </code>
                </li>
                <li>
                  Restart the application backend server!
                </li>
              </ol>

              <div className="pt-2 flex items-center gap-2 text-xs text-sap-muted">
                <Key className="w-3.5 h-3.5" />
                <span>Make sure there are no spaces or quotes around the key in the file.</span>
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="bg-red-500/20 hover:bg-red-500/35 border border-red-800/80 text-red-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

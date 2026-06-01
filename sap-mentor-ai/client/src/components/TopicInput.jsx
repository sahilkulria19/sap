import React, { useState } from 'react';
import { Search, Sparkles, Film, ArrowRight } from 'lucide-react';

const EXAMPLE_TOPICS = [
  "How to configure SAP CPI SFTP Adapter",
  "Create SAP CPI iFlow from SFTP to Target System",
  "How to create a free trial account on SAP BTP",
  "Configure HTTPS Sender to Mail Receiver in CPI"
];

export default function TopicInput({ onGenerateBlueprint, onGenerateScript, isLoading }) {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e, type) => {
    e.preventDefault();
    if (!topic.trim()) return;

    if (type === 'blueprint') {
      onGenerateBlueprint(topic);
    } else {
      onGenerateScript(topic);
    }
  };

  return (
    <div className="relative z-10 glass-panel p-6 rounded-2xl border border-sap-border shadow-glow-blue mb-8 no-print">
      <h2 className="text-lg font-bold font-display text-white mb-2 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-sap-cyan" />
        Choose or Enter an SAP Topic
      </h2>
      <p className="text-sm text-sap-muted mb-4">
        Input any SAP CPI configuration, adapter setup, integration pipeline, or custom package flow to receive instantly structured blueprints, UI steps, and narrations.
      </p>

      <form className="space-y-4">
        {/* Search Input Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-sap-muted" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3.5 bg-sap-dark border border-sap-border rounded-xl text-sap-text placeholder-sap-muted focus:outline-none focus:border-sap-cyan focus:ring-1 focus:ring-sap-cyan transition-colors"
            placeholder="e.g. How to configure SAP CPI SOAP Adapter with authentication..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Example Topics Quick-tags */}
        <div className="quick-prompts">
          <span className="text-xs font-semibold text-sap-muted uppercase tracking-wider block mb-2">
            Try these SAP blueprints:
          </span>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_TOPICS.map((t, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTopic(t)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                  topic === t
                    ? 'bg-sap-blue/40 border-sap-cyan text-white shadow-glow-cyan'
                    : 'bg-[#121829] border-sap-border text-sap-muted hover:border-sap-accent hover:text-white'
                }`}
                disabled={isLoading}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'blueprint')}
            disabled={isLoading || !topic.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-sap-accent to-sap-cyan text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-cyan-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <Sparkles className="w-5 h-5" />
            <span>Generate Implementation Guide</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
          
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'script')}
            disabled={isLoading || !topic.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-[#1b254b] hover:bg-[#233164] border border-sap-border text-sap-cyan font-semibold py-3 px-4 rounded-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-md hover:shadow-glow-cyan"
          >
            <Film className="w-5 h-5 text-sap-cyan" />
            <span>Generate Training Video Script</span>
          </button>
        </div>
      </form>
    </div>
  );
}

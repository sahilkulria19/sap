import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Cpu, Server, FileCode, CheckCircle2 } from 'lucide-react';

const LOADING_STEPS = [
  { text: "Connecting to Gemini AI Engine...", icon: Brain, color: "text-sap-cyan" },
  { text: "Consulting SAP CPI Senior Consultant Brain...", icon: Cpu, color: "text-sap-accent" },
  { text: "Analyzing configuration endpoints & parameters...", icon: Server, color: "text-blue-400" },
  { text: "Drafting step-by-step SAP UI navigation sequence...", icon: FileCode, color: "text-indigo-400" },
  { text: "Assembling visual iFlow routing maps & scripts...", icon: CheckCircle2, color: "text-emerald-400" }
];

export default function LoadingState() {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIdx((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const ActiveIcon = LOADING_STEPS[currentStepIdx].icon;

  return (
    <div className="relative z-10 glass-panel p-10 rounded-2xl border border-sap-border shadow-glow-blue py-16 flex flex-col items-center justify-center text-center max-w-2xl mx-auto my-8 no-print">
      {/* Premium Orbiting Spinner */}
      <div className="relative w-24 h-24 mb-8">
        {/* Outer glowing border ring */}
        <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-sap-cyan/30 animate-spin" style={{ animationDuration: '3s' }} />
        {/* Secondary ring rotating reverse */}
        <div className="absolute inset-2 rounded-full border-4 border-b-transparent border-sap-accent/30 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
        {/* Inner rotating ring */}
        <div className="absolute inset-4 rounded-full border-4 border-r-transparent border-white/20 animate-spin" style={{ animationDuration: '1s' }} />
        
        {/* Central pulsing icon container */}
        <div className="absolute inset-6 bg-gradient-to-br from-[#1b254b] to-[#121829] border border-sap-border rounded-full flex items-center justify-center shadow-inner">
          <ActiveIcon className={`w-6 h-6 animate-pulse ${LOADING_STEPS[currentStepIdx].color}`} />
        </div>
      </div>

      {/* Structured loading state steps list */}
      <div className="space-y-4 w-full max-w-md">
        <h3 className="text-xl font-bold font-display text-white">
          Designing SAP Mentor Materials
        </h3>
        
        {/* Dynamic sliding subtitle text */}
        <div className="h-6 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStepIdx}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-sm font-semibold text-sap-cyan"
            >
              {LOADING_STEPS[currentStepIdx].text}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Dynamic custom progress dots */}
        <div className="flex justify-center gap-1.5 pt-2">
          {LOADING_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentStepIdx ? 'w-6 bg-sap-cyan' : 'w-2 bg-sap-border'
              }`}
            />
          ))}
        </div>

        <p className="text-xs text-sap-muted pt-4 border-t border-sap-border/60">
          Google Gemini is generating structured JSON content. This normally takes 3-6 seconds because we are composing production-ready blueprints and detailed narrations.
        </p>
      </div>
    </div>
  );
}

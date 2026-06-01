import React, { useState, useEffect } from 'react';
import { Brain, Cpu, Wifi, WifiOff } from 'lucide-react';
import axios from 'axios';

export default function Header() {
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await axios.get('/health');
        setServerStatus('online');
      } catch (err) {
        setServerStatus('offline');
      }
    };
    checkHealth();
    // Poll status every 15 seconds
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="relative z-10 glass-panel border-b border-sap-border px-6 py-4 mb-8 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 no-print shadow-glow-blue">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-tr from-sap-accent to-sap-cyan rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Brain className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-sap-dark p-0.5 rounded-md border border-sap-border">
            <Cpu className="w-4 h-4 text-sap-cyan" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2">
            SAP <span className="text-transparent bg-clip-text bg-gradient-to-r from-sap-cyan to-sap-accent">Mentor AI</span>
          </h1>
          <p className="text-xs text-sap-muted">
            SAP CPI Integration Suite & Intelligent Training Designer
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* API Badge */}
        <div className="text-xs flex items-center gap-2 bg-[#17203b] border border-sap-border py-1.5 px-3 rounded-full">
          <span className="w-2 h-2 rounded-full bg-sap-cyan animate-ping" />
          <span className="font-semibold text-sap-text">Gemini 1.5 Flash</span>
        </div>

        {/* Server Status Badge */}
        <div className={`text-xs flex items-center gap-2 py-1.5 px-3 rounded-full border ${
          serverStatus === 'online'
            ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-400'
            : serverStatus === 'offline'
            ? 'bg-red-950/40 border-red-800/80 text-red-400'
            : 'bg-amber-950/40 border-amber-800/80 text-amber-400'
        }`}>
          {serverStatus === 'online' ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span>Backend Connected</span>
            </>
          ) : serverStatus === 'offline' ? (
            <>
              <WifiOff className="w-3.5 h-3.5 animate-bounce" />
              <span>Backend Offline</span>
            </>
          ) : (
            <>
              <span className="w-3 h-3 border-2 border-t-transparent border-amber-400 rounded-full animate-spin" />
              <span>Verifying Connection</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

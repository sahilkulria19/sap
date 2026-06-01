import React, { useState, useEffect, useRef } from 'react';
import { Send, Shuffle, Cpu, HardDrive, ArrowRight, Layers, Play, RotateCcw, Terminal, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

const NODE_ICONS = {
  sender: { icon: Send, bg: 'from-blue-600/20 to-blue-500/10', border: 'border-blue-500/40', text: 'text-blue-400' },
  adapter: { icon: Layers, bg: 'from-cyan-600/20 to-cyan-500/10', border: 'border-cyan-500/40', text: 'text-sap-cyan' },
  processor: { icon: Cpu, bg: 'from-indigo-600/20 to-indigo-500/10', border: 'border-indigo-500/40', text: 'text-indigo-400' },
  mapper: { icon: Shuffle, bg: 'from-purple-600/20 to-purple-500/10', border: 'border-purple-500/40', text: 'text-purple-400' },
  receiver: { icon: HardDrive, bg: 'from-emerald-600/20 to-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-400' }
};

export default function IFlowVisualizer({ plan, customLogs, onNodeActive }) {
  const [simStatus, setSimStatus] = useState('idle'); // 'idle', 'running', 'completed'
  const [logs, setLogs] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [activeNodeId, setActiveNodeId] = useState(null);
  const logEndRef = useRef(null);

  const defaultLogs = [
    "🤖 [1/6] Booting SAP BTP Trial Ingestion Agent...",
    "🔒 [1/6] Authenticating with SAP BTP Cockpit Trial account...",
    "🌐 [2/6] Navigating to SAP Integration Suite Dashboard...",
    "📂 [2/6] Accessing Cloud Integration Design Workspace...",
    "📂 [2/6] Selecting target package: 'SAP_Mentor_AI_Generated'...",
    "➕ [3/6] Creating new Integration Flow artifact...",
    "🎨 [3/6] Canvas initialized. Setting up routing pipeline...",
    "📦 [4/6] Placing SFTP Sender Channel on sender boundary...",
    "⚙️ [4/6] Configuring SFTP connection parameters (Host: sftp.trial.sap.com, Port: 22)...",
    "⚙️ [4/6] Binding Security User Credential artifact: 'SFTP_CONN_CRED'...",
    "📦 [5/6] Placing Content Modifier node for dynamic metadata generation...",
    "⚙️ [5/6] Configuring headers (Setting: SAP_SFTP_Filename = output_${date:now:yyyyMMdd}.xml)...",
    "📦 [5/6] Placing Message Mapping engine (Source Schema -> Target Schema)...",
    "⚙️ [5/6] Binding visual XSLT mappings and schema conversions...",
    "📦 [6/6] Placing SFTP Receiver Channel on destination boundary...",
    "⚙️ [6/6] Configuring write mode: 'Create' & directory path: '/outbox'...",
    "💾 [6/6] Saving Integration Flow artifact...",
    "🚀 [6/6] Initiating runtime deployment to SAP BTP tenant...",
    "⚡ [6/6] Deploying. Waiting for Integration Suite runtime confirmation...",
    "✅ [6/6] Integration Flow active! Endpoint successfully registered.",
    "🔔 [6/6] Task complete. Native architect notification dispatched."
  ];

  const simLogsList = customLogs && customLogs.length > 0 ? customLogs : defaultLogs;

  // Auto-scroll simulation logs
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  useEffect(() => {
    if (simStatus === 'running' && currentStepIndex >= 0 && currentStepIndex < simLogsList.length) {
      const delay = currentStepIndex === 0 ? 300 : 1200;
      const timer = setTimeout(() => {
        setLogs(prev => [...prev, simLogsList[currentStepIndex]]);
        
        const logText = simLogsList[currentStepIndex];
        
        // Dynamic node mapping based on matching words or pipeline index
        const matchedNode = plan.find(n => 
          (n.name && logText.toLowerCase().includes(n.name.toLowerCase())) || 
          (n.type && logText.toLowerCase().includes(n.type.toLowerCase()))
        );

        if (matchedNode) {
          setActiveNodeId(matchedNode.id);
          if (onNodeActive) onNodeActive(matchedNode.id, plan.indexOf(matchedNode));
        } else if (logText.includes("SFTP Sender") || logText.includes("BTP Cockpit")) {
          setActiveNodeId("sender-node");
          if (onNodeActive) onNodeActive("sender-node", 0);
        } else if (logText.includes("Content Modifier") || logText.includes("Message Mapping") || logText.includes("Mapping")) {
          setActiveNodeId("mapper-node");
          if (onNodeActive) onNodeActive("mapper-node", Math.floor(plan.length / 2));
        } else if (logText.includes("SFTP Receiver") || logText.includes("outbox")) {
          setActiveNodeId("receiver-node");
          if (onNodeActive) onNodeActive("receiver-node", plan.length - 1);
        } else if (logText.includes("Saving") || logText.includes("Initiating")) {
          setActiveNodeId("all");
        } else {
          // Fallback to sequential ratio index
          const progressRatio = currentStepIndex / simLogsList.length;
          if (progressRatio < 0.1) {
            setActiveNodeId("all");
          } else if (progressRatio >= 0.9) {
            setActiveNodeId("all-green");
          } else {
            const nodeIdx = Math.floor(progressRatio * plan.length);
            if (plan[nodeIdx]) {
              const matchedNodeId = plan[nodeIdx].id || `node-${nodeIdx}`;
              setActiveNodeId(matchedNodeId);
              if (onNodeActive) onNodeActive(matchedNodeId, nodeIdx);
            } else {
              setActiveNodeId(null);
            }
          }
        }

        setCurrentStepIndex(prev => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    } else if (simStatus === 'running' && currentStepIndex === simLogsList.length) {
      setSimStatus('completed');
      setActiveNodeId("all-green");
      // Trigger notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification("SAP CPI Agent: Deployment Successful", {
          body: "The SAP CPI Integration Flow has been successfully created, configured, and deployed to your trial tenant.",
          icon: '/favicon.ico'
        });
      }
    }
  }, [simStatus, currentStepIndex]);

  const startSimulation = () => {
    setSimStatus('running');
    setLogs([]);
    setCurrentStepIndex(0);
    setActiveNodeId(null);
  };

  const resetSimulation = () => {
    setSimStatus('idle');
    setLogs([]);
    setCurrentStepIndex(-1);
    setActiveNodeId(null);
  };

  if (!plan || plan.length === 0) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-sap-border text-center text-sap-muted">
        No iFlow blueprint plan data found. Click "Generate Guide" to generate.
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border border-sap-border shadow-glow-blue relative overflow-hidden">
      <style>{`
        @keyframes pulseDash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .pulse-path {
          stroke-dasharray: 6, 4;
          animation: pulseDash 1.2s linear infinite;
        }
      `}</style>
      
      {/* Background decoration grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1328_1px,transparent_1px),linear-gradient(to_bottom,#0c1328_1px,transparent_1px)] bg-[size:24px_24px] opacity-30 pointer-events-none" />

      <h3 className="text-md font-bold font-display text-white mb-6 relative z-10 flex items-center gap-2">
        <Layers className="w-5 h-5 text-sap-cyan" />
        SAP CPI Integration Flow Pipeline Map
      </h3>

      {/* Pipeline Container */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-4 py-8 overflow-x-auto w-full min-h-[220px]">
        {plan.map((node, index) => {
          const config = NODE_ICONS[node.type] || NODE_ICONS.processor;
          const NodeIcon = config.icon;

          let highlightBorder = config.border;
          if (activeNodeId === 'all') {
            highlightBorder = 'border-sap-cyan shadow-glow-cyan animate-pulse';
          } else if (activeNodeId === 'all-green') {
            highlightBorder = 'border-emerald-500 shadow-glow-green scale-105';
          } else if (activeNodeId === node.id || activeNodeId === `node-${index}`) {
            highlightBorder = 'border-sap-cyan shadow-glow-cyan scale-105';
          } else if (activeNodeId === 'sender-node' && (node.type === 'sender' || (node.type === 'adapter' && index === 1))) {
            highlightBorder = 'border-blue-400 shadow-glow-blue scale-105';
          } else if (activeNodeId === 'mapper-node' && (node.type === 'mapper' || node.type === 'processor')) {
            highlightBorder = 'border-purple-400 shadow-glow-purple scale-105';
          } else if (activeNodeId === 'receiver-node' && (node.type === 'receiver' || (node.type === 'adapter' && index === plan.length - 2))) {
            highlightBorder = 'border-emerald-400 shadow-glow-green scale-105';
          }

          return (
            <React.Fragment key={node.id || index}>
              {/* Connector between nodes */}
              {index > 0 && (
                <div className="flex items-center justify-center lg:flex-1 h-8 lg:h-auto w-full lg:w-auto min-w-[30px] my-2 lg:my-0">
                  {/* Horizontal SVG line on large screens, vertical arrow on small screens */}
                  <svg className="hidden lg:block w-full h-8" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <path
                      d="M 0 10 H 100"
                      fill="none"
                      stroke="rgba(31, 41, 77, 0.8)"
                      strokeWidth="2"
                    />
                    <path
                      d="M 0 10 H 100"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2"
                      className="pulse-path"
                    />
                    <polygon points="96,7 100,10 96,13" fill="#06b6d4" />
                  </svg>
                  
                  {/* Mobile Arrow down */}
                  <div className="lg:hidden flex items-center justify-center text-sap-cyan/60 animate-bounce">
                    <ArrowRight className="w-5 h-5 rotate-90" />
                  </div>
                </div>
              )}

              {/* Node Card Container */}
              <div className="group relative w-full lg:w-[170px] flex-shrink-0 transition-all duration-300">
                <div className={`p-4 rounded-xl border bg-gradient-to-br ${config.bg} ${highlightBorder} hover:border-sap-cyan transition-all duration-300 shadow-md group-hover:shadow-glow-cyan text-center flex flex-col items-center justify-center`}>
                  
                  {/* Node Icon */}
                  <div className={`w-10 h-10 rounded-lg bg-[#0a0f1d]/80 border border-sap-border/60 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ${config.text}`}>
                    <NodeIcon className="w-5 h-5" />
                  </div>

                  {/* Node Title */}
                  <span className="text-xs font-bold text-white block truncate w-full">
                    {node.name}
                  </span>

                  {/* Node Type Label */}
                  <span className={`text-[9px] uppercase font-semibold mt-1 tracking-wider px-2 py-0.5 rounded bg-sap-dark border border-sap-border ${config.text}`}>
                    {node.type}
                  </span>
                </div>

                {/* Hover Details Card (Absolute Tooltip) */}
                <div className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 w-[220px] bg-sap-card border border-sap-border p-3 rounded-lg shadow-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none text-left">
                  <h4 className="text-xs font-bold text-sap-cyan mb-1 flex items-center gap-1">
                    <NodeIcon className="w-3.5 h-3.5" />
                    {node.name}
                  </h4>
                  <p className="text-[10px] text-sap-text leading-relaxed">
                    {node.description}
                  </p>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-sap-border/40 pt-4">
        {/* Component Legend */}
        <div className="flex flex-wrap gap-4 text-[10px] text-sap-muted">
          <span className="flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-blue-400" /> Sender
          </span>
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sap-cyan" /> Adapter Channel
          </span>
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Processor
          </span>
          <span className="flex items-center gap-1.5">
            <Shuffle className="w-3.5 h-3.5 text-purple-400" /> Mapper
          </span>
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> Receiver
          </span>
        </div>

        {/* Simulation control trigger */}
        <div className="flex items-center gap-2 no-print">
          {simStatus === 'idle' ? (
            <button
              onClick={startSimulation}
              className="flex items-center gap-1.5 bg-sap-cyan/15 hover:bg-sap-cyan/25 border border-sap-cyan/40 text-sap-cyan px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-glow-cyan active:scale-[0.98]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Agent iFlow Build</span>
            </button>
          ) : (
            <button
              onClick={resetSimulation}
              className="flex items-center gap-1.5 bg-sap-dark hover:bg-sap-card border border-sap-border text-sap-muted hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Agent</span>
            </button>
          )}
        </div>
      </div>

      {/* Simulator Terminal Logs Overlay Panel */}
      {simStatus !== 'idle' && (
        <div className="mt-6 border border-sap-border rounded-xl bg-[#070a14] overflow-hidden no-print transition-all shadow-2xl">
          {/* Header Panel */}
          <div className="bg-sap-card border-b border-sap-border px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Terminal className="w-4 h-4 text-sap-cyan" />
              <span>AI CPI-Auto-Builder Terminal Console</span>
            </div>
            
            <div className="flex items-center gap-2">
              {simStatus === 'running' ? (
                <div className="flex items-center gap-1 text-[10px] text-sap-cyan font-bold animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Agent Deploying...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Deployment Complete!</span>
                </div>
              )}
            </div>
          </div>

          {/* Logs Terminal Area */}
          <div className="p-4 h-[200px] overflow-y-auto font-mono text-[11px] leading-relaxed space-y-2 select-text text-left">
            {logs.map((log, idx) => {
              let logClass = "text-sap-text";
              if (log.includes("✅") || log.includes("Complete")) logClass = "text-emerald-400 font-bold";
              else if (log.includes("🤖") || log.includes("Deploying")) logClass = "text-sap-cyan";
              else if (log.includes("⚙️")) logClass = "text-sap-muted";
              else if (log.includes("🔒") || log.includes("BTP Cockpit")) logClass = "text-yellow-500/95";
              
              return (
                <div key={idx} className={`${logClass} flex items-start gap-1.5`}>
                  <span>&gt;</span>
                  <span>{log}</span>
                </div>
              );
            })}
            
            {simStatus === 'running' && (
              <div className="text-sap-cyan/60 flex items-center gap-1 animate-pulse">
                <span>&gt;</span>
                <span className="w-1.5 h-3.5 bg-sap-cyan inline-block animate-[blink_1s_step-start_infinite]"></span>
                <style>{`
                  @keyframes blink {
                    50% { opacity: 0; }
                  }
                `}</style>
              </div>
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}

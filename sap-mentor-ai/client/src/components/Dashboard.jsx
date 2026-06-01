import React, { useState } from 'react';
import { BookOpen, Layers, Compass, HelpCircle, Film, MousePointerClick, Download, Copy, Check, Info, AlertTriangle, Cpu } from 'lucide-react';
import IFlowVisualizer from './IFlowVisualizer';
import VideoScriptViewer from './VideoScriptViewer';
import InteractiveSandbox from './InteractiveSandbox';

export default function Dashboard({ data, isBonusScript, topicName }) {
  const [activeTab, setActiveTab] = useState('steps'); // default to component guide
  const [leftTab, setLeftTab] = useState('canvas'); // 'canvas' or 'sandbox'
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(0);
  const [copiedStep, setCopiedStep] = useState(null);

  const handleCopyStepText = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(index);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // If the user generated ONLY the Video Script, render the specialized Video Storyboard Studio directly!
  if (isBonusScript) {
    return (
      <div className="relative z-10 my-8">
        <VideoScriptViewer scriptData={data} isBonusScript={true} topicName={topicName} />
      </div>
    );
  }

  // Get active step data based on selected node index (clamped to steps length)
  const activeStep = data.steps && data.steps[selectedNodeIndex] ? data.steps[selectedNodeIndex] : data.steps[0];
  const activeUI = data.uiInstructions && data.uiInstructions[selectedNodeIndex] ? data.uiInstructions[selectedNodeIndex] : data.uiInstructions[0];
  const activeMistake = data.commonMistakes && data.commonMistakes[selectedNodeIndex] ? data.commonMistakes[selectedNodeIndex] : data.commonMistakes[0];
  const activeNode = data.iflowPlan && data.iflowPlan[selectedNodeIndex] ? data.iflowPlan[selectedNodeIndex] : data.iflowPlan[0];

  const INSPECTOR_TABS = [
    { id: 'steps', label: 'Component Guide', icon: Compass },
    { id: 'overview', label: 'Solution Overview', icon: BookOpen },
    { id: 'script', label: 'Narration Script', icon: Film },
    { id: 'mistakes', label: 'Troubleshooting', icon: HelpCircle }
  ];

  return (
    <div className="relative z-10 my-8 space-y-8 animate-fade-in">
      
      {/* EXPORT FLOATING ACTION PANEL FOR USER DELIVERABLES */}
      <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-4 p-4 glass-panel border border-sap-border shadow-md rounded-2xl">
        <div>
          <span className="text-[10px] font-bold text-sap-cyan uppercase tracking-widest block mb-0.5">SAP Integration Workspace</span>
          <strong className="text-sm text-white">AI-Powered Developer Sandbox Console</strong>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-[#1b254b] hover:bg-[#233164] border border-sap-border text-sap-cyan font-semibold py-2.5 px-4 rounded-xl text-xs active:scale-[0.98] transition-all shadow-sm hover:shadow-glow-cyan"
        >
          <Download className="w-4 h-4" />
          <span>Export Blueprint PDF</span>
        </button>
      </div>

      {/* MAIN DUAL-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch print:hidden">
        
        {/* LEFT PANEL (7 columns): Pipeline Visualizer Canvas */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Visual Workspace Toggles */}
          <div className="flex items-center justify-between bg-sap-card border border-sap-border p-2 rounded-xl flex-shrink-0">
            <div className="flex gap-1 bg-sap-dark p-0.5 rounded-lg border border-sap-border/60">
              <button
                type="button"
                onClick={() => setLeftTab('canvas')}
                className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all ${
                  leftTab === 'canvas'
                    ? 'bg-sap-accent text-white font-extrabold shadow-glow-blue'
                    : 'text-sap-muted hover:text-white'
                }`}
              >
                Visual iFlow Map
              </button>
              <button
                type="button"
                onClick={() => setLeftTab('sandbox')}
                className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all ${
                  leftTab === 'sandbox'
                    ? 'bg-sap-cyan text-sap-dark font-extrabold shadow-glow-cyan'
                    : 'text-sap-muted hover:text-white'
                }`}
              >
                Interactive Live Sandbox
              </button>
            </div>
            
            <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-sap-cyan/70 tracking-wider px-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sap-cyan animate-pulse"></span>
              <span>Simulation Workspace</span>
            </div>
          </div>

          {leftTab === 'canvas' ? (
            <div className="flex flex-col gap-6">
              <IFlowVisualizer
                plan={data.iflowPlan}
                customLogs={data.simulationLogs}
                onNodeActive={(nodeId, nodeIndex) => setSelectedNodeIndex(nodeIndex)}
              />
              
              <div className="glass-panel p-4 rounded-xl border border-sap-border flex gap-3 text-xs text-sap-muted shadow-sm">
                <Info className="w-5 h-5 text-sap-cyan flex-shrink-0 animate-pulse" />
                <p className="leading-relaxed">
                  <strong>Interactive Instructions:</strong> Click on any component block above, or click <strong>"Simulate Agent iFlow Build"</strong> to auto-assemble. The inspector board on the right will dynamically update to show parameters, UI actions, and guidelines for the selected component!
                </p>
              </div>
            </div>
          ) : (
            <InteractiveSandbox
              steps={data.steps.map((s, idx) => ({
                title: s.title,
                description: s.description,
                screen: data.uiInstructions && data.uiInstructions[idx] ? data.uiInstructions[idx].screen : 'Design'
              }))}
              data={data}
              topicName={topicName}
              activeStepIndex={selectedNodeIndex}
              onStepActive={(idx) => setSelectedNodeIndex(idx)}
              isAutoPlaying={false}
              onAutoPlayToggle={() => {}}
            />
          )}
        </div>

        {/* RIGHT PANEL (5 columns): Unified Workspace Inspector Panel */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="glass-panel rounded-2xl border border-sap-border shadow-lg flex flex-col h-full overflow-hidden">
            
            {/* Inspector Navigation Tabs */}
            <div className="bg-sap-card border-b border-sap-border p-2 flex items-center justify-between">
              <span className="text-[10px] font-bold text-sap-muted uppercase tracking-widest px-2">Inspector Board</span>
              <div className="flex gap-1 overflow-x-auto max-w-[280px] sm:max-w-none">
                {INSPECTOR_TABS.map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-sap-cyan text-sap-dark font-extrabold shadow-glow-cyan'
                          : 'text-sap-muted hover:text-white hover:bg-sap-dark/50'
                      }`}
                    >
                      <TabIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inspector Panel Body Content */}
            <div className="p-5 flex-1 overflow-y-auto max-h-[500px] scrollbar-thin text-left space-y-6">
              
              {/* TAB 1: COMPONENT GUIDE */}
              {activeTab === 'steps' && (
                <div className="space-y-6">
                  {/* Selected component metadata */}
                  {activeNode && (
                    <div className="p-4 rounded-xl border border-sap-cyan/30 bg-sap-cyan/5 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-sap-cyan uppercase tracking-wider">Active Workspace Component</span>
                        <span className="inline-block text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-sap-dark text-sap-cyan border border-sap-border">
                          {activeNode.type}
                        </span>
                      </div>
                      <h4 className="text-md font-bold text-white font-display">{activeNode.name}</h4>
                      <p className="text-xs text-sap-muted leading-relaxed">{activeNode.description}</p>
                    </div>
                  )}

                  {/* Guide steps */}
                  {activeStep && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-sap-border/40 pb-2">
                        <span className="text-xs font-bold text-sap-cyan uppercase tracking-wider">Configuration Protocol (Step {activeStep.step})</span>
                        <button
                          onClick={() => handleCopyStepText(`${activeStep.title}\n${activeStep.description}`, activeStep.step)}
                          className="text-[10px] text-sap-muted hover:text-white flex items-center gap-1"
                        >
                          {copiedStep === activeStep.step ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Guide</span>
                            </>
                          )}
                        </button>
                      </div>
                      <h5 className="text-sm font-bold text-white">{activeStep.title}</h5>
                      <p className="text-xs text-sap-text leading-relaxed">{activeStep.description}</p>
                      
                      {activeStep.proTip && (
                        <div className="bg-[#17203b] border-l-4 border-sap-cyan rounded-r-xl p-3 text-xs text-sap-text italic flex gap-2">
                          <Info className="w-4 h-4 text-sap-cyan flex-shrink-0" />
                          <p><strong>Pro-Tip:</strong> {activeStep.proTip}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* UI Navigation sequence */}
                  {activeUI && (
                    <div className="space-y-3 pt-4 border-t border-sap-border/40">
                      <span className="text-xs font-bold text-sap-cyan uppercase tracking-wider block">SAP Web UI Click Path</span>
                      <div className="p-3.5 rounded-xl bg-sap-dark/50 border border-sap-border space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-white uppercase tracking-wider">{activeUI.screen}</span>
                          <span className="text-[10px] font-semibold text-sap-muted">Action: {activeUI.action}</span>
                        </div>
                        <p className="text-xs text-sap-muted leading-relaxed">{activeUI.details}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: SOLUTION OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-sap-cyan uppercase tracking-wider block">Executive Summary</span>
                    <p className="text-xs text-sap-text leading-relaxed whitespace-pre-line">{data.overview}</p>
                  </div>

                  <div className="space-y-3">
                    <span className="text-xs font-bold text-sap-cyan uppercase tracking-wider block">Component Architecture Map</span>
                    <div className="space-y-3">
                      {data.components.map((comp, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl border border-sap-border bg-[#121829]/50 flex gap-2.5">
                          <div className="w-6 h-6 rounded-lg bg-sap-dark border border-sap-border flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-sap-cyan">#{idx + 1}</span>
                          </div>
                          <div>
                            <strong className="text-xs text-white block font-display">{comp.name}</strong>
                            <span className="inline-block text-[8px] uppercase font-bold px-1.5 rounded bg-[#17203b] text-sap-cyan border border-sap-border mt-0.5">
                              {comp.role}
                            </span>
                            <p className="text-[11px] text-sap-muted mt-1 leading-relaxed">{comp.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: NARRATION SCRIPT */}
              {activeTab === 'script' && (
                <div className="space-y-6">
                  <VideoScriptViewer scriptData={data.videoScript} isBonusScript={false} topicName={topicName} />
                </div>
              )}

              {/* TAB 4: TROUBLESHOOTING */}
              {activeTab === 'mistakes' && (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-sap-cyan uppercase tracking-wider block">Quality Assurance & Failures Checkpoints</span>
                  <div className="space-y-4">
                    {data.commonMistakes.map((mistake, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-red-950/80 bg-red-950/5 flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 border border-red-800/40">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <h4 className="text-xs font-bold text-red-300">{mistake.mistake}</h4>
                          <p className="text-[11px] text-red-200/80"><strong>Impact:</strong> {mistake.impact}</p>
                          <p className="text-[11px] text-emerald-300 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-900/40 mt-2"><strong>AI Resolution:</strong> {mistake.fix}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* =================================================== */}
      {/* FORCE PRINT ELEMENT: Renders complete stacked document during printing */}
      {/* =================================================== */}
      <div className="hidden print:block space-y-12">
        <div className="border-b-4 border-sap-blue pb-6 mb-8">
          <h1 className="text-3xl font-bold font-display text-sap-blue">SAP Mentor AI</h1>
          <p className="text-sm text-sap-muted uppercase font-semibold tracking-wider mt-1">
            Complete Implementation Blueprint & Trainer Narration Guide
          </p>
          <div className="mt-4 flex justify-between text-xs text-sap-muted">
            <span>Topic: <strong className="text-black">{topicName}</strong></span>
            <span>Generated via: <strong>Google Gemini AI</strong></span>
          </div>
        </div>

        {/* Section 1: Overview */}
        <div className="print-force">
          <h2 className="text-xl font-bold text-sap-blue mb-4">1. Executive Overview & Component Structure</h2>
          <p className="text-sm text-black leading-relaxed whitespace-pre-line mb-6">{data.overview}</p>
          
          <h3 className="text-md font-bold text-sap-blue mb-3">SAP Integration Architecture Required</h3>
          <div className="grid grid-cols-2 gap-4">
            {data.components && data.components.map((c, i) => (
              <div key={i} className="p-3 border border-gray-300 rounded bg-gray-50">
                <strong className="text-xs block text-sap-blue">{c.name}</strong>
                <span className="text-[10px] text-gray-500 uppercase font-semibold">Role: {c.role}</span>
                <p className="text-xs text-gray-600 mt-1">{c.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Flow blueprint list */}
        <div className="print-force">
          <h2 className="text-xl font-bold text-sap-blue mb-4">2. Integration Flow Routing Blueprint</h2>
          <div className="space-y-4">
            {data.iflowPlan && data.iflowPlan.map((step, i) => (
              <div key={i} className="p-3 border border-gray-300 rounded flex gap-4">
                <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center font-bold text-sap-blue">
                  {i + 1}
                </div>
                <div>
                  <strong className="text-sm text-black block">{step.name}</strong>
                  <span className="text-[10px] text-gray-400 uppercase font-bold">{step.type}</span>
                  <p className="text-xs text-gray-700 mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Step-by-Step */}
        <div className="print-force">
          <h2 className="text-xl font-bold text-sap-blue mb-4">3. Step-by-Step Deployment Guide</h2>
          <div className="space-y-4">
            {data.steps && data.steps.map((s, i) => (
              <div key={i} className="p-4 border border-gray-300 rounded bg-gray-50">
                <h4 className="font-bold text-sm text-black">Step {s.step}: {s.title}</h4>
                <p className="text-xs text-gray-700 mt-1">{s.description}</p>
                {s.proTip && (
                  <div className="mt-2 p-2 bg-blue-50 border-l-4 border-blue-600 text-xs text-blue-900 italic">
                    <strong>Pro Tip:</strong> {s.proTip}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: UI Navigate */}
        <div className="print-force">
          <h2 className="text-xl font-bold text-sap-blue mb-4">4. SAP BTP Cockpit UI Navigation Instructions</h2>
          <table className="w-full text-left border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-xs font-bold text-sap-blue">Step</th>
                <th className="border border-gray-300 p-2 text-xs font-bold text-sap-blue">UI Screen Tab</th>
                <th className="border border-gray-300 p-2 text-xs font-bold text-sap-blue">Required Action</th>
                <th className="border border-gray-300 p-2 text-xs font-bold text-sap-blue">Configuration Input Details</th>
              </tr>
            </thead>
            <tbody>
              {data.uiInstructions && data.uiInstructions.map((ui, i) => (
                <tr key={i} className="text-xs">
                  <td className="border border-gray-300 p-2 font-bold">{ui.step}</td>
                  <td className="border border-gray-300 p-2 font-medium">{ui.screen}</td>
                  <td className="border border-gray-300 p-2">{ui.action}</td>
                  <td className="border border-gray-300 p-2 text-gray-600">{ui.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 5: Troubleshooting */}
        <div className="print-force">
          <h2 className="text-xl font-bold text-sap-blue mb-4">5. Mistakes & Troubleshooting Guides</h2>
          <div className="space-y-4">
            {data.commonMistakes && data.commonMistakes.map((m, i) => (
              <div key={i} className="p-4 border border-red-300 rounded bg-red-50/30">
                <h4 className="font-bold text-sm text-red-900">Mistake: {m.mistake}</h4>
                <p className="text-xs text-red-700 mt-1"><strong>Impact:</strong> {m.impact}</p>
                <div className="mt-2 p-2 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-950">
                  <strong>Correct Resolution:</strong> {m.fix}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

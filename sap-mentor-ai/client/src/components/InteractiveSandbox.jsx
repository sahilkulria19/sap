import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, ChevronRight, ChevronLeft, RotateCcw, Monitor, Shield, Layers, HelpCircle, User, Search, Settings, Activity, Compass, Terminal, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

// Hotspot coordinates (percentage values mapping to the simulated screen layouts)
const HOTSPOTS = {
  welcome: { x: '50%', y: '65%' },
  btp_register: { x: '58%', y: '68%' },
  btp_subaccount: { x: '82%', y: '28%' },
  cpi_security_create: { x: '18%', y: '32%' },
  cpi_security_deploy: { x: '85%', y: '82%' },
  cpi_canvas_adapter: { x: '35%', y: '48%' },
  cpi_canvas_save: { x: '82%', y: '16%' },
  cpi_canvas_deploy: { x: '90%', y: '16%' },
  cpi_monitor_row: { x: '45%', y: '42%' },
  cpi_monitor_log: { x: '82%', y: '35%' },
  conclusion: { x: '50%', y: '78%' }
};

export default function InteractiveSandbox({ 
  steps = [], 
  data = null,
  topicName = '', 
  activeStepIndex = -1, 
  onStepActive, 
  isAutoPlaying = false, 
  onAutoPlayToggle 
}) {
  const [currentStep, setCurrentStep] = useState(-1); // -1: Intro splash, 0..N: steps, N: Outro
  const safeSteps = Array.isArray(steps) ? steps : [];
  const [screenType, setScreenType] = useState('welcome');
  const [cursorCoords, setCursorCoords] = useState(HOTSPOTS.welcome);
  const [isClicking, setIsClicking] = useState(false);
  const [sandboxMode, setSandboxMode] = useState('auto'); // 'auto' or 'manual'
  const [cpiSaved, setCpiSaved] = useState(false);
  const [cpiDeployed, setCpiDeployed] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [securitySaved, setSecuritySaved] = useState(false);
  const [subaccountCreated, setSubaccountCreated] = useState(false);
  const [btpRegistered, setBtpRegistered] = useState(false);
  const [selectedMonitorRow, setSelectedMonitorRow] = useState(null);
  const [showMonitorDetail, setShowMonitorDetail] = useState(false);
  const [voiceBriefing, setVoiceBriefing] = useState(true);

  const containerRef = useRef(null);

  // Extract dynamic secure credential alias from data payload
  const getDynamicCredentialName = () => {
    if (data && data.components) {
      const secComp = data.components.find(c => 
        c.name.toLowerCase().includes("credential") || 
        c.name.toLowerCase().includes("security") || 
        c.name.toLowerCase().includes("key")
      );
      if (secComp) {
        // extract first word/alias e.g. "SFTP_CONN_CRED"
        const cleanName = secComp.name.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
        return cleanName.substring(0, 16) || "DEV_CRED_ALIAS";
      }
    }
    return "DEV_CONN_CRED";
  };

  // Sync internal step with parent if provided
  useEffect(() => {
    if (activeStepIndex !== undefined && activeStepIndex !== null) {
      setCurrentStep(activeStepIndex);
    }
  }, [activeStepIndex]);

  // Sync step changes to detect screen type, set cursor, and handle voice synthesis
  useEffect(() => {
    let type = 'welcome';
    let coords = HOTSPOTS.welcome;

    if (currentStep === -1) {
      type = 'welcome';
      coords = HOTSPOTS.welcome;
    } else if (currentStep === safeSteps.length) {
      type = 'conclusion';
      coords = HOTSPOTS.conclusion;
    } else if (safeSteps[currentStep]) {
      const step = safeSteps[currentStep];
      const title = (step.title || "").toLowerCase();
      const desc = (step.description || "").toLowerCase();
      const screen = (step.screen || "").toLowerCase();

      // Enhanced screen detection heuristics
      const isSecurity = screen.includes("security") || screen.includes("credential") || screen.includes("keystore") || screen.includes("auth") || screen.includes("key pair") ||
                         title.includes("security") || title.includes("credential") || title.includes("keystore") || title.includes("auth") || title.includes("key pair");

      const isMonitor = screen.includes("monitor") || screen.includes("processing") || screen.includes("logs") || screen.includes("troubleshoot") || screen.includes("mpl") ||
                        title.includes("monitor") || title.includes("processing") || title.includes("logs") || title.includes("troubleshoot") || title.includes("mpl");

      const isCanvas = screen.includes("canvas") || screen.includes("design") || screen.includes("iflow") || screen.includes("adapter") || screen.includes("configure") || screen.includes("pipeline") || screen.includes("mapping") || screen.includes("modifier") || screen.includes("flow") ||
                       title.includes("canvas") || title.includes("design") || title.includes("iflow") || title.includes("adapter") || title.includes("configure") || title.includes("pipeline") || title.includes("mapping") || title.includes("modifier") || title.includes("flow");

      const isBtp = screen.includes("btp") || screen.includes("cockpit") || screen.includes("trial") || screen.includes("account") || screen.includes("subaccount") || screen.includes("region") || screen.includes("universal id") || screen.includes("signup") || screen.includes("login") ||
                    title.includes("btp") || title.includes("cockpit") || title.includes("trial") || title.includes("account") || title.includes("subaccount") || title.includes("region") || title.includes("universal id") || title.includes("signup") || title.includes("login");

      if (isSecurity) {
        type = 'cpi_security';
        coords = securitySaved ? HOTSPOTS.cpi_security_deploy : (securityModalOpen ? HOTSPOTS.cpi_security_deploy : HOTSPOTS.cpi_security_create);
      } else if (isMonitor) {
        type = 'cpi_monitor';
        coords = selectedMonitorRow ? HOTSPOTS.cpi_monitor_log : HOTSPOTS.cpi_monitor_row;
      } else if (isCanvas) {
        type = 'cpi_canvas';
        coords = cpiSaved ? (cpiDeployed ? HOTSPOTS.cpi_canvas_adapter : HOTSPOTS.cpi_canvas_deploy) : HOTSPOTS.cpi_canvas_save;
      } else if (isBtp) {
        type = 'btp_cockpit';
        coords = btpRegistered ? (subaccountCreated ? HOTSPOTS.btp_subaccount : HOTSPOTS.btp_subaccount) : HOTSPOTS.btp_register;
      } else {
        type = 'generic_details';
        coords = { x: '50%', y: '50%' };
      }
    }

    setScreenType(type);
    setCursorCoords(coords);

    // Speak a brief 1-sentence prompt if voice briefing is enabled
    if (voiceBriefing && currentStep !== -2) {
      window.speechSynthesis.cancel();
      let text = '';
      if (currentStep === -1) {
        text = `Welcome. Today we will explore: ${topicName}. Let's begin.`;
      } else if (currentStep === safeSteps.length) {
        text = `All steps completed successfully. Your configuration is now active.`;
      } else if (safeSteps[currentStep]) {
        text = `Step ${currentStep + 1}: ${safeSteps[currentStep].title}.`;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.15;
      window.speechSynthesis.speak(utterance);
    }
  }, [currentStep, safeSteps, topicName]);

  // Autoplay simulation handler
  useEffect(() => {
    let autoplayTimer;
    if (isAutoPlaying && sandboxMode === 'auto') {
      autoplayTimer = setTimeout(() => {
        setIsClicking(true);
        setTimeout(() => {
          setIsClicking(false);
          
          if (screenType === 'welcome') {
            handleNext();
          } else if (screenType === 'btp_cockpit') {
            if (!btpRegistered) {
              setBtpRegistered(true);
            } else if (!subaccountCreated) {
              setSubaccountCreated(true);
              handleNext();
            } else {
              handleNext();
            }
          } else if (screenType === 'cpi_security') {
            if (!securityModalOpen) {
              setSecurityModalOpen(true);
            } else {
              setSecuritySaved(true);
              setSecurityModalOpen(false);
              handleNext();
            }
          } else if (screenType === 'cpi_canvas') {
            if (!cpiSaved) {
              setCpiSaved(true);
            } else {
              setCpiDeployed(true);
              handleNext();
            }
          } else if (screenType === 'cpi_monitor') {
            if (!selectedMonitorRow) {
              setSelectedMonitorRow(1);
            } else {
              setShowMonitorDetail(true);
              handleNext();
            }
          } else {
            handleNext();
          }
        }, 300);
      }, 3300);
    }
    return () => clearTimeout(autoplayTimer);
  }, [isAutoPlaying, currentStep, screenType, btpRegistered, subaccountCreated, securityModalOpen, cpiSaved, selectedMonitorRow, sandboxMode]);

  const handleNext = () => {
    if (currentStep < safeSteps.length) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (onStepActive) onStepActive(nextStep);
    }
  };

  const handleBack = () => {
    if (currentStep > -1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      if (onStepActive) onStepActive(prevStep);
    }
  };

  const handleReset = () => {
    setCurrentStep(-1);
    setBtpRegistered(false);
    setSubaccountCreated(false);
    setSecurityModalOpen(false);
    setSecuritySaved(false);
    setCpiSaved(false);
    setCpiDeployed(false);
    setSelectedMonitorRow(null);
    setShowMonitorDetail(false);
    if (onStepActive) onStepActive(-1);
  };

  const handleHotspotClick = () => {
    setIsClicking(true);
    setTimeout(() => {
      setIsClicking(false);
      if (screenType === 'welcome') {
        handleNext();
      } else if (screenType === 'btp_cockpit') {
        if (!btpRegistered) {
          setBtpRegistered(true);
        } else {
          setSubaccountCreated(true);
          handleNext();
        }
      } else if (screenType === 'cpi_security') {
        if (!securityModalOpen) {
          setSecurityModalOpen(true);
        } else {
          setSecuritySaved(true);
          setSecurityModalOpen(false);
          handleNext();
        }
      } else if (screenType === 'cpi_canvas') {
        if (!cpiSaved) {
          setCpiSaved(true);
        } else {
          setCpiDeployed(true);
          handleNext();
        }
      } else if (screenType === 'cpi_monitor') {
        if (!selectedMonitorRow) {
          setSelectedMonitorRow(1);
        } else {
          setShowMonitorDetail(true);
          handleNext();
        }
      } else {
        handleNext();
      }
    }, 200);
  };

  const getMockURL = () => {
    if (screenType === 'btp_cockpit') {
      return btpRegistered 
        ? "https://account.hanatrial.ondemand.com/trial/#/home/trial" 
        : "https://trial.btp.sap.com/cockpit/register";
    }
    if (screenType === 'cpi_security') {
      return "https://tenant.cpi.us10.hana.ondemand.com/itspaces/shell/monitoring/SecurityMaterial";
    }
    if (screenType === 'cpi_canvas') {
      return "https://tenant.cpi.us10.hana.ondemand.com/itspaces/shell/design/content/package/iflow";
    }
    if (screenType === 'cpi_monitor') {
      return "https://tenant.cpi.us10.hana.ondemand.com/itspaces/shell/monitoring/MessageProcessing";
    }
    return "https://trial.sap.com/landing-suite";
  };

  return (
    <div className="relative w-full flex flex-col glass-panel rounded-3xl border border-sap-border overflow-hidden bg-sap-dark/95 shadow-glow-blue select-none">
      
      {/* 1. MOCK BROWSER HEADER BAR */}
      <div className="bg-[#0b0f19] border-b border-sap-border px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
          <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
          <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
        </div>

        <div className="flex-1 max-w-xl bg-sap-dark/85 border border-sap-border/60 rounded-xl px-4 py-1.5 text-xs text-sap-muted font-mono flex items-center gap-2 select-text">
          <Monitor className="w-3.5 h-3.5 text-sap-cyan flex-shrink-0" />
          <span className="truncate">{getMockURL()}</span>
        </div>

        <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-sap-cyan">
          <span className="w-2.5 h-2.5 rounded-full bg-sap-cyan animate-pulse"></span>
          <span className="hidden sm:inline">SAP Trial Sandbox</span>
        </div>
      </div>

      {/* 2. MAIN SIMULATED CANVAS CONTAINER */}
      <div 
        ref={containerRef}
        className="relative w-full min-h-[380px] bg-[#070a13] flex flex-col md:flex-row overflow-hidden"
      >
        {/* Virtual Mouse Pointer */}
        {sandboxMode === 'auto' && (
          <div 
            style={{ 
              position: 'absolute',
              left: cursorCoords.x, 
              top: cursorCoords.y, 
              transform: `translate(-10px, -10px) scale(${isClicking ? 0.8 : 1})`,
              transition: 'left 1.2s cubic-bezier(0.25, 1, 0.5, 1), top 1.2s cubic-bezier(0.25, 1, 0.5, 1), transform 0.2s ease',
              zIndex: 999,
              pointerEvents: 'none'
            }}
            className="text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] flex flex-col items-center gap-1"
          >
            <svg className="w-5 h-5 text-sap-cyan fill-current" viewBox="0 0 24 24">
              <path d="M4.5 3v15.2l4.3-4.3 3 7.2 3.5-1.5-3-7.2 5.2-.2L4.5 3z" stroke="black" strokeWidth="1.5" />
            </svg>
            {isClicking && (
              <span className="absolute -inset-2 rounded-full border border-sap-cyan/80 bg-sap-cyan/20 animate-ping"></span>
            )}
          </div>
        )}

        {/* Dynamic click hotspot overlays (Manual mode only) */}
        {sandboxMode === 'manual' && cursorCoords && (
          <div 
            style={{ left: cursorCoords.x, top: cursorCoords.y }}
            onClick={handleHotspotClick}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-50 flex items-center justify-center"
          >
            <span className="w-12 h-12 rounded-full border-2 border-sap-cyan bg-sap-cyan/15 animate-pulse absolute"></span>
            <span className="w-6 h-6 rounded-full bg-sap-cyan/40 animate-ping absolute"></span>
            <span className="w-3.5 h-3.5 rounded-full bg-sap-cyan shadow-glow-cyan"></span>
          </div>
        )}

        {/* A. WELCOME SPLASH SCREEN */}
        {screenType === 'welcome' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 animate-fade-in relative z-10">
            <div className="w-16 h-16 rounded-3xl bg-sap-blue/20 border border-sap-cyan/30 flex items-center justify-center text-sap-cyan shadow-glow-cyan animate-pulse">
              <Compass className="w-9 h-9" />
            </div>
            <div className="space-y-2 max-w-lg">
              <h3 className="text-xl md:text-2xl font-bold text-white font-display">SAP Integration Interactive Sandbox</h3>
              <p className="text-xs text-sap-muted leading-relaxed">
                Click <strong>"Start Interactive Walkthrough"</strong> to run a simulated click-by-click developer demo. We will show you how to configure credentials, packages, and routes for your SAP environment.
              </p>
            </div>
            <button 
              onClick={handleNext}
              className="bg-sap-cyan text-sap-dark hover:bg-white px-6 py-3 rounded-2xl font-extrabold text-xs tracking-wider uppercase active:scale-[0.97] transition-all shadow-glow-cyan"
            >
              Start Interactive Walkthrough
            </button>
          </div>
        )}

        {/* B. MOCK SAP BTP COCKPIT PANEL */}
        {screenType === 'btp_cockpit' && (
          <div className="flex-1 flex animate-fade-in text-left">
            <div className="w-44 bg-[#0a0e1a] border-r border-sap-border/60 p-3 hidden sm:flex flex-col gap-2.5 text-[10px] font-bold text-sap-muted">
              <span className="text-[8px] uppercase tracking-wider text-sap-cyan/70 font-black mb-1">SAP BTP Cockpit</span>
              <div className="bg-sap-blue/10 border-l-2 border-sap-cyan text-white p-2 rounded flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sap-cyan" />
                <span>Global Account</span>
              </div>
              <div className="p-2 hover:text-white transition-colors cursor-default">Directories</div>
              <div className={`p-2 transition-colors cursor-default flex items-center gap-1.5 ${btpRegistered ? 'text-sap-cyan font-bold' : ''}`}>
                <Activity className="w-3.5 h-3.5" />
                <span>Subaccounts</span>
              </div>
              <div className="p-2 hover:text-white transition-colors cursor-default">Entitlements</div>
              <div className="p-2 hover:text-white transition-colors cursor-default">Security</div>
            </div>

            <div className="flex-1 p-6 flex flex-col justify-between">
              {!btpRegistered ? (
                <div className="max-w-md mx-auto w-full bg-sap-card border border-sap-border/80 rounded-2xl p-5 space-y-4">
                  <h4 className="text-sm font-bold text-white border-b border-sap-border/40 pb-2">SAP Universal ID Signup</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-sap-muted uppercase font-bold block mb-1">Business Email</label>
                      <input type="text" disabled className="w-full bg-sap-dark border border-sap-border rounded-lg p-2 text-xs text-white" value="developer@abusiness.com" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-sap-muted uppercase font-bold block mb-1">First Name</label>
                        <input type="text" disabled className="w-full bg-sap-dark border border-sap-border rounded-lg p-2 text-xs text-white" value="Sahil" />
                      </div>
                      <div>
                        <label className="text-[10px] text-sap-muted uppercase font-bold block mb-1">Last Name</label>
                        <input type="text" disabled className="w-full bg-sap-dark border border-sap-border rounded-lg p-2 text-xs text-white" value="Kumar" />
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setBtpRegistered(true)}
                    className="w-full bg-sap-cyan hover:bg-white text-sap-dark font-extrabold text-xs py-2.5 rounded-xl transition-all"
                  >
                    Register & Activate Account
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-white">Subaccounts Overview</h4>
                    <button 
                      onClick={() => setSubaccountCreated(true)}
                      className="bg-sap-blue/30 border border-sap-cyan/40 hover:bg-sap-blue/60 text-sap-cyan text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1"
                    >
                      <span>Create Trial Subaccount</span>
                    </button>
                  </div>

                  {subaccountCreated ? (
                    <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex gap-3 animate-fade-in">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <strong className="text-xs text-white block">Subaccount Created: 'trial'</strong>
                        <p className="text-[10px] text-sap-muted leading-relaxed">
                          <strong>Region:</strong> US East (VA) - AWS | <strong>Subdomain:</strong> trial-subdomain
                        </p>
                        <span className="inline-flex text-[9px] uppercase font-bold bg-[#14231a] text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded mt-2">
                          Active & Provisioned
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-sap-border/60 rounded-xl p-8 text-center text-xs text-sap-muted">
                      No active subaccounts found. Click the button to configure and provision.
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-sap-border/30 pt-3 text-[10px] text-sap-muted flex justify-between">
                <span>SAP Global Tenant ID: btp-trial-us10</span>
                <span>Active Status</span>
              </div>
            </div>
          </div>
        )}

        {/* C. MOCK SAP SECURITY MATERIAL VAULT */}
        {screenType === 'cpi_security' && (
          <div className="flex-1 flex animate-fade-in text-left">
            <div className="w-44 bg-[#0a0e1a] border-r border-sap-border/60 p-3 hidden sm:flex flex-col gap-2.5 text-[10px] font-bold text-sap-muted">
              <span className="text-[8px] uppercase tracking-wider text-sap-cyan/70 font-black mb-1">SAP Monitoring</span>
              <div className="p-2 hover:text-white transition-colors cursor-default">Message Dashboard</div>
              <div className="bg-sap-blue/10 border-l-2 border-sap-cyan text-white p-2 rounded flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-sap-cyan" />
                <span>Security Material</span>
              </div>
              <div className="p-2 hover:text-white transition-colors cursor-default">Keystore</div>
              <div className="p-2 hover:text-white transition-colors cursor-default">Connectivity Tests</div>
            </div>

            <div className="flex-1 p-5 flex flex-col justify-between relative">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-white">Manage Security Material</h4>
                  <button 
                    onClick={() => setSecurityModalOpen(true)}
                    className="bg-sap-cyan text-sap-dark hover:bg-white text-[10px] font-bold py-1.5 px-3 rounded-lg"
                  >
                    + Create &rarr; User Credential
                  </button>
                </div>

                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-sap-border text-sap-muted font-bold">
                      <th className="pb-2">Name / Alias</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Deploy Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-sap-border/40 text-sap-text">
                      <td className="py-2.5 font-semibold text-white">BTP_OUTBOUND_AUTH</td>
                      <td>OAuth2 Client Credentials</td>
                      <td><span className="text-emerald-400">Deployed</span></td>
                    </tr>
                    {securitySaved && (
                      <tr className="border-b border-sap-border/40 text-sap-text animate-fade-in">
                        <td className="py-2.5 font-semibold text-sap-cyan">{getDynamicCredentialName()}</td>
                        <td>User Credential</td>
                        <td><span className="text-emerald-400">Deployed</span></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {securityModalOpen && (
                <div className="absolute inset-0 bg-sap-dark/90 flex items-center justify-center p-4 z-40 animate-fade-in">
                  <div className="w-full max-w-sm bg-sap-card border border-sap-border rounded-xl p-4 space-y-4">
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider border-b border-sap-border pb-1.5">
                      Create User Credential
                    </h5>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[9px] text-sap-muted uppercase font-bold block mb-0.5">Name</label>
                        <input type="text" disabled className="w-full bg-sap-dark border border-sap-border rounded p-1.5 text-xs text-sap-cyan font-mono" value={getDynamicCredentialName()} />
                      </div>
                      <div>
                        <label className="text-[9px] text-sap-muted uppercase font-bold block mb-0.5">User</label>
                        <input type="text" disabled className="w-full bg-sap-dark border border-sap-border rounded p-1.5 text-xs text-white" value="sftp_developer_btp" />
                      </div>
                      <div>
                        <label className="text-[9px] text-sap-muted uppercase font-bold block mb-0.5">Password</label>
                        <input type="password" disabled className="w-full bg-sap-dark border border-sap-border rounded p-1.5 text-xs text-white" value="••••••••••••••••" />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-2 border-t border-sap-border/40">
                      <button 
                        onClick={() => setSecurityModalOpen(false)}
                        className="bg-sap-dark border border-sap-border text-sap-muted px-3 py-1.5 rounded text-[10px] font-bold"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => {
                          setSecuritySaved(true);
                          setSecurityModalOpen(false);
                        }}
                        className="bg-sap-cyan text-sap-dark px-3.5 py-1.5 rounded text-[10px] font-extrabold"
                      >
                        Deploy Credential
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-sap-border/30 pt-3 text-[10px] text-sap-muted flex justify-between">
                <span>Security Engine status: Active</span>
                <span>Tenant credentials vault</span>
              </div>
            </div>
          </div>
        )}

        {/* D. MOCK SAP CPI DESIGN CANVAS */}
        {screenType === 'cpi_canvas' && (
          <div className="flex-1 flex animate-fade-in text-left">
            <div className="w-14 bg-[#0a0e1a] border-r border-sap-border/60 p-2 hidden sm:flex flex-col items-center gap-4 text-[10px] font-bold text-sap-muted">
              <span className="text-[8px] uppercase tracking-wider text-sap-cyan/70 font-black mb-1">CPI</span>
              <div className="w-8 h-8 rounded-lg bg-sap-blue/20 flex items-center justify-center text-sap-cyan border border-sap-cyan/40">
                <Layers className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center hover:text-white transition-colors"><Activity className="w-4 h-4" /></div>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center hover:text-white transition-colors"><Settings className="w-4 h-4" /></div>
            </div>

            <div className="flex-1 flex flex-col justify-between overflow-x-hidden">
              <div className="bg-[#0b0f19] border-b border-sap-border/60 p-3 flex justify-between items-center">
                <span className="text-xs font-bold text-white truncate max-w-[200px]">iFlow: {topicName.replace(/\s+/g, '_') || "Configure_Pipeline"}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCpiSaved(true)}
                    className={`text-[9px] font-bold py-1 px-2.5 rounded transition-all border ${
                      cpiSaved 
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                        : 'bg-[#121829] border-sap-border text-sap-cyan hover:border-sap-cyan'
                    }`}
                  >
                    {cpiSaved ? 'Saved Draft' : 'Save'}
                  </button>
                  <button 
                    onClick={() => setCpiDeployed(true)}
                    disabled={!cpiSaved}
                    className={`text-[9px] font-extrabold py-1 px-2.5 rounded transition-all ${
                      cpiDeployed 
                        ? 'bg-sap-accent text-white shadow-glow-blue' 
                        : 'bg-sap-cyan text-sap-dark disabled:opacity-40 disabled:pointer-events-none'
                    }`}
                  >
                    {cpiDeployed ? 'Deployed Active' : 'Deploy'}
                  </button>
                </div>
              </div>

              {/* Graphical flow diagram dynamically parsed from data.iflowPlan */}
              <div className="flex-1 flex items-center justify-center p-4 relative bg-[#090d16] overflow-x-auto min-h-[160px] max-w-full">
                <div className="flex items-center gap-2.5 flex-nowrap whitespace-nowrap">
                  {data && data.iflowPlan && data.iflowPlan.length > 0 ? (
                    data.iflowPlan.map((node, index) => {
                      // Check if this node is active during walkthrough
                      const isActiveNode = currentStep >= 0 && steps[currentStep] && (
                        (steps[currentStep].title && steps[currentStep].title.toLowerCase().includes(node.name.toLowerCase())) ||
                        (steps[currentStep].description && steps[currentStep].description.toLowerCase().includes(node.name.toLowerCase())) ||
                        (index === currentStep % data.iflowPlan.length)
                      );
                      
                      return (
                        <React.Fragment key={node.id || index}>
                          {index > 0 && <div className="text-sap-cyan animate-pulse text-[11px] font-bold">&rarr;</div>}
                          <div className={`bg-[#121a30] px-3 py-2 rounded-xl text-center min-w-[90px] max-w-[130px] border transition-all ${
                            isActiveNode 
                              ? 'border-sap-cyan shadow-glow-cyan scale-105 bg-sap-cyan/10' 
                              : 'border-sap-border hover:border-sap-cyan/40'
                          }`}>
                            <strong className="text-[9px] text-white block truncate">{node.name}</strong>
                            <span className="text-[7px] text-sap-muted uppercase font-bold block mt-0.5">{node.type}</span>
                          </div>
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <>
                      <div className="bg-[#121a30] border border-sap-border px-3 py-2 rounded-lg text-center w-24">
                        <strong className="text-[10px] text-white block">Sender System</strong>
                        <span className="text-[8px] text-sap-muted uppercase font-bold">Sender</span>
                      </div>
                      <div className="text-sap-cyan animate-pulse">➔</div>
                      <div className="bg-[#121a30] border-2 border-sap-cyan/60 px-3 py-2.5 rounded-lg text-center w-28 relative shadow-glow-cyan">
                        <strong className="text-[10px] text-white block">Integration Router</strong>
                        <span className="text-[8px] text-sap-cyan uppercase font-bold">Adapter</span>
                      </div>
                      <div className="text-sap-cyan animate-pulse">➔</div>
                      <div className="bg-[#121a30] border border-sap-border px-3 py-2 rounded-lg text-center w-24">
                        <strong className="text-[10px] text-white block">Receiver System</strong>
                        <span className="text-[8px] text-sap-muted uppercase font-bold">Receiver</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Status logs panel */}
              <div className="bg-[#05070f] border-t border-sap-border/60 p-3 h-24 overflow-y-auto font-mono text-[9px] leading-relaxed text-sap-muted text-left">
                <div>&gt; [iFlow Designer] Canvas active. Preparing component configurations...</div>
                {cpiSaved && <div>&gt; [iFlow Designer] Save draft triggered. Configuration schemas validated successfully.</div>}
                {cpiDeployed && (
                  <div className="text-sap-cyan animate-pulse">
                    &gt; [Deployment Logs] Deploying flow draft... Success! Active endpoint listening.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* E. MOCK SAP MESSAGE MONITOR SCREEN */}
        {screenType === 'cpi_monitor' && (
          <div className="flex-1 flex animate-fade-in text-left">
            <div className="w-44 bg-[#0a0e1a] border-r border-sap-border/60 p-3 hidden sm:flex flex-col gap-2.5 text-[10px] font-bold text-sap-muted">
              <span className="text-[8px] uppercase tracking-wider text-sap-cyan/70 font-black mb-1">CPI Monitor</span>
              <div className="bg-sap-blue/10 border-l-2 border-sap-cyan text-white p-2 rounded flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-sap-cyan" />
                <span>Message Processing</span>
              </div>
              <div className="p-2 hover:text-white transition-colors cursor-default">Integration Content</div>
              <div className="p-2 hover:text-white transition-colors cursor-default">Locks</div>
            </div>

            <div className="flex-1 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white">Monitor Message Processing Log (MPL)</h4>
                
                <div className="space-y-2">
                  <div 
                    onClick={() => setSelectedMonitorRow(1)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center ${
                      selectedMonitorRow === 1 
                        ? 'border-sap-cyan bg-sap-cyan/15 shadow-glow-cyan' 
                        : 'border-sap-border bg-sap-card hover:border-sap-cyan/55'
                    }`}
                  >
                    <div>
                      <strong className="text-[11px] text-white block">MSG_ID: BTP-CPI-MPL-{Math.floor(Math.random() * 90000) + 10000}</strong>
                      <span className="text-[9px] text-sap-muted block truncate max-w-[220px]">iFlow: {topicName.replace(/\s+/g, '_') || "Configure_Pipeline"}</span>
                    </div>
                    <span className="text-[9px] uppercase font-bold bg-[#14231a] text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                      Completed
                    </span>
                  </div>

                  {/* Log Details Trace Console loaded from data.simulationLogs */}
                  {selectedMonitorRow && (
                    <div className="p-3 bg-[#05070f] border border-sap-border/80 rounded-lg font-mono text-[9px] text-sap-text leading-relaxed text-left space-y-1 animate-fade-in max-h-[140px] overflow-y-auto scrollbar-thin">
                      <strong className="text-sap-cyan block mb-1">--- MESSAGE PROCESSING LOGS ---</strong>
                      {data && data.simulationLogs && data.simulationLogs.length > 0 ? (
                        data.simulationLogs.map((log, idx) => (
                          <div key={idx} className={log.includes("✅") || log.includes("Complete") || log.includes("ready") ? "text-emerald-400" : ""}>
                            &gt; {log}
                          </div>
                        ))
                      ) : (
                        <>
                          <div>[10:20:15] Outbound connection initialized.</div>
                          <div>[10:20:17] Authenticating credentials alias...</div>
                          <div>[10:20:18] Authentication successful. Transferred payload.</div>
                          <div>[10:20:19] Message lifecycle complete. Status set to COMPLETED.</div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-sap-border/30 pt-3 text-[10px] text-sap-muted flex justify-between">
                <span>MPL Storage: 98% free</span>
                <span>Active Status</span>
              </div>
            </div>
          </div>
        )}
        {/* G. GENERIC DETAILS SCREEN */}
        {screenType === 'generic_details' && (
          <div className="flex-1 flex animate-fade-in text-left">
            <div className="w-44 bg-[#0a0e1a] border-r border-sap-border/60 p-3 hidden sm:flex flex-col gap-2.5 text-[10px] font-bold text-sap-muted">
              <span className="text-[8px] uppercase tracking-wider text-sap-cyan/70 font-black mb-1">SAP Suite</span>
              <div className="bg-sap-blue/10 border-l-2 border-sap-cyan text-white p-2 rounded flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-sap-cyan" />
                <span>Configuration</span>
              </div>
              <div className="p-2 hover:text-white transition-colors cursor-default">System Settings</div>
              <div className="p-2 hover:text-white transition-colors cursor-default">Properties</div>
            </div>

            <div className="flex-1 p-6 flex flex-col justify-between">
              <div className="space-y-4 max-w-md mx-auto w-full">
                <div className="flex items-center justify-between border-b border-sap-border/40 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-sap-cyan" />
                    <span>Configuration Console</span>
                  </h4>
                  <span className="text-[9px] uppercase font-bold bg-[#17203b] border border-sap-border px-2 py-0.5 rounded text-sap-cyan">
                    Step {currentStep + 1}
                  </span>
                </div>

                <div className="bg-sap-card border border-sap-border rounded-xl p-4 space-y-3">
                  <h5 className="text-xs font-bold text-white">
                    {safeSteps[currentStep]?.title || "Apply Properties"}
                  </h5>
                  <p className="text-[11px] text-sap-muted leading-relaxed">
                    {safeSteps[currentStep]?.description || "Configure the adapter parameters according to your integration blueprint guidelines."}
                  </p>
                  
                  {safeSteps[currentStep]?.screen && (
                    <div className="text-[10px] text-sap-cyan font-mono bg-sap-dark/50 p-2 rounded border border-sap-border/40">
                      Target Screen: {safeSteps[currentStep].screen}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleNext}
                  className="w-full bg-sap-cyan hover:bg-white text-sap-dark font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-glow-cyan"
                >
                  Configure &amp; Continue &rarr;
                </button>
              </div>

              <div className="border-t border-sap-border/30 pt-3 text-[10px] text-sap-muted flex justify-between">
                <span>Tenant Profile: Custom Configuration</span>
                <span>Active Status</span>
              </div>
            </div>
          </div>
        )}

        {/* F. OUTRO/CONCLUSION SCREEN */}
        {screenType === 'conclusion' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 animate-fade-in relative z-10">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-glow-success animate-pulse">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-2 max-w-lg">
              <h3 className="text-xl md:text-2xl font-bold text-white font-display">Tutorial Walkthrough Complete!</h3>
              <p className="text-xs text-sap-muted leading-relaxed">
                You've successfully completed the setup and configuration walkthrough. Feel free to run the simulation again, or consult the step-by-step guides in the inspector panel.
              </p>
            </div>
            <button 
              onClick={handleReset}
              className="bg-[#17203b] hover:bg-[#233164] border border-sap-border text-sap-cyan font-bold px-6 py-3 rounded-2xl text-xs uppercase active:scale-[0.97] transition-all shadow-sm"
            >
              Restart Simulation Tour
            </button>
          </div>
        )}
      </div>

      {/* 3. SIMULATOR MEDIA PLAYBACK CONTROLLER */}
      <div className="bg-[#0b0f19] border-t border-sap-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onAutoPlayToggle}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              isAutoPlaying 
                ? 'bg-sap-accent text-white shadow-glow-blue' 
                : 'bg-sap-cyan/15 text-sap-cyan hover:bg-sap-cyan/25 border border-sap-cyan/30'
            }`}
            title={isAutoPlaying ? "Pause Simulation" : "Auto-Play Simulation"}
          >
            {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={handleReset}
            className="w-9 h-9 rounded-xl bg-sap-dark hover:bg-sap-card border border-sap-border text-sap-muted hover:text-white flex items-center justify-center transition-all"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center gap-2 max-w-sm">
          <button 
            disabled={currentStep === -1}
            onClick={handleBack}
            className="text-sap-muted hover:text-white disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 h-1.5 bg-sap-dark rounded-full relative flex items-center justify-between px-1">
            <div 
              style={{ width: `${((currentStep + 1) / (safeSteps.length + 1)) * 100}%` }}
              className="absolute left-0 top-0 h-full bg-sap-cyan rounded-full transition-all duration-300"
            />
            <span 
              onClick={() => { setCurrentStep(-1); if (onStepActive) onStepActive(-1); }}
              className={`w-2.5 h-2.5 rounded-full z-10 cursor-pointer transition-all ${
                currentStep === -1 ? 'bg-sap-cyan scale-125' : 'bg-sap-border hover:bg-sap-muted'
              }`}
            />
            {safeSteps.map((_, idx) => (
              <span 
                key={idx}
                onClick={() => { setCurrentStep(idx); if (onStepActive) onStepActive(idx); }}
                className={`w-2.5 h-2.5 rounded-full z-10 cursor-pointer transition-all ${
                  currentStep === idx ? 'bg-sap-cyan scale-125' : idx < currentStep ? 'bg-sap-cyan/60' : 'bg-sap-border hover:bg-sap-muted'
                }`}
              />
            ))}
            <span 
              onClick={() => { setCurrentStep(safeSteps.length); if (onStepActive) onStepActive(safeSteps.length); }}
              className={`w-2.5 h-2.5 rounded-full z-10 cursor-pointer transition-all ${
                currentStep === safeSteps.length ? 'bg-sap-cyan scale-125' : 'bg-sap-border hover:bg-sap-muted'
              }`}
            />
          </div>

          <button 
            disabled={currentStep === safeSteps.length}
            onClick={handleNext}
            className="text-sap-muted hover:text-white disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-sap-dark border border-sap-border p-0.5 rounded-xl text-[9px] uppercase font-bold text-sap-muted">
            <button 
              onClick={() => setSandboxMode('auto')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                sandboxMode === 'auto' ? 'bg-sap-accent text-white font-extrabold' : 'hover:text-white'
              }`}
            >
              Auto-Play
            </button>
            <button 
              onClick={() => {
                setSandboxMode('manual');
                if (isAutoPlaying && onAutoPlayToggle) onAutoPlayToggle();
              }}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                sandboxMode === 'manual' ? 'bg-sap-cyan text-sap-dark font-extrabold' : 'hover:text-white'
              }`}
            >
              Manual Click
            </button>
          </div>

          <button 
            onClick={() => setVoiceBriefing(!voiceBriefing)}
            className={`text-[9px] uppercase font-bold border px-2.5 py-1.5 rounded-xl transition-all ${
              voiceBriefing 
                ? 'bg-sap-cyan/10 border-sap-cyan/30 text-sap-cyan' 
                : 'bg-sap-dark border-sap-border text-sap-muted'
            }`}
          >
            Voice: {voiceBriefing ? 'On' : 'Off'}
          </button>
        </div>
      </div>

    </div>
  );
}

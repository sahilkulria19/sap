import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import TopicInput from './components/TopicInput';
import Dashboard from './components/Dashboard';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import { Brain, Cpu, MessageSquare, BookOpen, Layers, Star, Video } from 'lucide-react';

// Configure standard axios defaults
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
axios.defaults.baseURL = apiBaseUrl;

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [genData, setGenData] = useState(null);
  const [isBonusScript, setIsBonusScript] = useState(false);
  const [activeTopic, setActiveTopic] = useState('');

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const sendDesktopNotification = (title, message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico'
      });
    }
  };

  // Call /api/generate (Main blueprint)
  const handleGenerateBlueprint = async (topic) => {
    setIsLoading(true);
    setError(null);
    setGenData(null);
    setIsBonusScript(false);
    setActiveTopic(topic);

    try {
      const response = await axios.post('/api/generate', { topic });
      setGenData(response.data);
      sendDesktopNotification(
        "SAP Mentor AI - Task Completed",
        `Integration blueprint for "${topic}" has been successfully generated!`
      );
    } catch (err) {
      console.error(err);
      const serverErr = err.response?.data;
      setError({
        error: serverErr?.error || "AI Synthesis Failed",
        message: serverErr?.message || "Verify the backend server is active and try again.",
        isConfigError: serverErr?.isConfigError || false
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Call /api/generate-video-script (Bonus deep script feature)
  const handleGenerateScript = async (topic) => {
    setIsLoading(true);
    setError(null);
    setGenData(null);
    setIsBonusScript(true);
    setActiveTopic(topic);

    try {
      const response = await axios.post('/api/generate-video-script', { topic });
      setGenData(response.data);
      sendDesktopNotification(
        "SAP Mentor AI - Task Completed",
        `E-learning video training script for "${topic}" is ready!`
      );
    } catch (err) {
      console.error(err);
      const serverErr = err.response?.data;
      setError({
        error: serverErr?.error || "Video Script Synthesis Failed",
        message: serverErr?.message || "Failed to create highly detailed e-learning video scripts. Ensure server connectivity.",
        isConfigError: serverErr?.isConfigError || false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (activeTopic) {
      if (isBonusScript) {
        handleGenerateScript(activeTopic);
      } else {
        handleGenerateBlueprint(activeTopic);
      }
    }
  };

  return (
    <div className="relative min-h-screen px-4 md:px-8 py-6 max-w-7xl mx-auto overflow-hidden">
      {/* Background visual graphics */}
      <div className="glow-mesh" />
      <div className="glow-mesh-secondary" />

      {/* Corporate Header */}
      <Header />

      {/* Search Console Input */}
      <TopicInput
        onGenerateBlueprint={handleGenerateBlueprint}
        onGenerateScript={handleGenerateScript}
        isLoading={isLoading}
      />

      {/* DYNAMIC SCREEN ORCHESTRATION */}
      {isLoading && <LoadingState />}

      {error && (
        <ErrorState
          error={error.error}
          message={error.message}
          isConfigError={error.isConfigError}
          onRetry={handleRetry}
        />
      )}

      {/* Render Main Dashboard when data is generated */}
      {!isLoading && !error && genData && (
        <Dashboard
          data={genData}
          isBonusScript={isBonusScript}
          topicName={activeTopic}
        />
      )}

      {/* INITIAL WELCOME SCREEN SPLASH */}
      {!isLoading && !error && !genData && (
        <div className="relative z-10 glass-panel p-8 md:p-12 rounded-3xl border border-sap-border shadow-glow-blue max-w-4xl mx-auto my-12 text-center space-y-8 no-print">
          
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sap-blue/20 border border-sap-accent/40 text-sap-cyan text-xs font-semibold uppercase tracking-wider mb-2">
              <Star className="w-3.5 h-3.5 fill-sap-cyan text-sap-cyan" />
              Intelligent SAP Mentoring
            </div>
            
            <h2 className="text-3xl md:text-4xl font-extrabold font-display text-white tracking-tight leading-tight">
              Bridge the Gap in SAP Integration Learning
            </h2>
            <p className="text-sm md:text-base text-sap-muted max-w-2xl mx-auto leading-relaxed">
              SAP Mentor AI combines deep architecture blueprints and visual flow planning to instantly explain complex scenarios. Perfect for integration builders, support engineers, and technical course creators.
            </p>
          </div>

          {/* Quick-features Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
            
            <div className="p-5 rounded-2xl border border-sap-border/60 bg-[#121829]/50 hover:bg-[#121829]/90 transition-all text-left space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-800/40 text-blue-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <strong className="text-sm font-bold text-white block">Interactive Guides</strong>
              <p className="text-xs text-sap-muted leading-relaxed">
                Receive detailed beginner guides explaining BTP adapters, custom scripts, and security credentials.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-sap-border/60 bg-[#121829]/50 hover:bg-[#121829]/90 transition-all text-left space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-800/40 text-sap-cyan">
                <Layers className="w-5 h-5" />
              </div>
              <strong className="text-sm font-bold text-white block">Visual Pipeline Maps</strong>
              <p className="text-xs text-sap-muted leading-relaxed">
                Generate flowing message pipelines mapping data adapters, processors, mappings, and receivers.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-sap-border/60 bg-[#121829]/50 hover:bg-[#121829]/90 transition-all text-left space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-800/40 text-indigo-400">
                <Video className="w-5 h-5" />
              </div>
              <strong className="text-sm font-bold text-white block">Video Teleprompter</strong>
              <p className="text-xs text-sap-muted leading-relaxed">
                Translate integration logic directly into professional narration transcripts with custom scroll speed tickers.
              </p>
            </div>

          </div>

          {/* Prompt quick hints footer */}
          <div className="border-t border-sap-border/40 pt-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-sap-muted">
            <span className="flex items-center gap-1">
              <Brain className="w-4 h-4 text-sap-cyan animate-pulse" />
              Fueled by Gemini 1.5 Flash
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              <Cpu className="w-4 h-4 text-sap-accent" />
              SAP Integration Suite Standards
            </span>
          </div>

        </div>
      )}

      {/* Simple standard footer */}
      <footer className="relative z-10 border-t border-sap-border/30 pt-4 mt-16 text-center text-xs text-sap-muted no-print">
        <p>© 2026 SAP Mentor AI. Designed for SAP CPI and Integration Architects.</p>
      </footer>
    </div>
  );
}

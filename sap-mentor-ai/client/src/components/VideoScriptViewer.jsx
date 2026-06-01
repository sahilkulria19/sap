import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Copy, Check, Film, Tv, Clock, BookOpen, AlertCircle } from 'lucide-react';
import InteractiveSandbox from './InteractiveSandbox';

export default function VideoScriptViewer({ scriptData, isBonusScript, topicName }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(25); // px per second
  const [copied, setCopied] = useState(false);
  const [teleprompterMode, setTeleprompterMode] = useState(false);
  const scrollContainerRef = useRef(null);
  const requestRef = useRef(null);
  const previousTimeRef = useRef(null);

  // teleprompter scrolling loop
  useEffect(() => {
    const scroll = (time) => {
      if (previousTimeRef.current !== undefined && scrollContainerRef.current) {
        const deltaTime = (time - previousTimeRef.current) / 1000; // seconds
        const currentScroll = scrollContainerRef.current.scrollTop;
        const maxScroll = scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight;
        
        if (currentScroll >= maxScroll - 1) {
          setIsPlaying(false);
        } else {
          scrollContainerRef.current.scrollTop = currentScroll + scrollSpeed * deltaTime;
        }
      }
      previousTimeRef.current = time;
      if (isPlaying) {
        requestRef.current = requestAnimationFrame(scroll);
      }
    };

    if (isPlaying) {
      requestRef.current = requestAnimationFrame(scroll);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      previousTimeRef.current = undefined;
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, scrollSpeed]);

  const [speakingSceneIndex, setSpeakingSceneIndex] = useState(-2); // -2: idle, -1: intro, 0..N: scenes, N: outro
  const [isSpeechPlaying, setIsSpeechPlaying] = useState(false);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(-1);
  const [narratorMode, setNarratorMode] = useState('summary'); // 'summary' or 'full'
  const [leftPanelTab, setLeftPanelTab] = useState('viewport'); // 'flowchart' or 'viewport' default viewport!
  const speakingIndexRef = useRef(-2);

  // Clear speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Sync ref with state to prevent closure issues in speech onend callbacks
  useEffect(() => {
    speakingIndexRef.current = speakingSceneIndex;
  }, [speakingSceneIndex]);

  const speakSection = (index) => {
    window.speechSynthesis.cancel();
    
    if (index === -2) {
      setSpeakingSceneIndex(-2);
      setIsSpeechPlaying(false);
      return;
    }

    let textToSpeak = '';
    if (narratorMode === 'summary') {
      if (index === -1) {
        textToSpeak = `This video guides you on: ${topicName}. Let's get started.`;
      } else if (index >= 0 && index < scriptData.scenes.length) {
        const scene = scriptData.scenes[index];
        textToSpeak = `Scene ${scene.sceneNumber} covers ${scene.sectionTitle}. Visual indicators showcase ${scene.visuals}.`;
      } else if (index === scriptData.scenes.length) {
        textToSpeak = "Finally, we conclude with standard validation steps and key takeaways. Thanks for watching!";
      }
    } else {
      if (index === -1) {
        textToSpeak = scriptData.introduction;
      } else if (index >= 0 && index < scriptData.scenes.length) {
        textToSpeak = scriptData.scenes[index].narration;
      } else if (index === scriptData.scenes.length) {
        textToSpeak = scriptData.outro;
      }
    }

    if (textToSpeak === '') {
      // Done speaking
      setSpeakingSceneIndex(-2);
      setIsSpeechPlaying(false);
      return;
    }

    setSpeakingSceneIndex(index);
    setSelectedSceneIndex(index);
    setIsSpeechPlaying(true);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (englishVoice) utterance.voice = englishVoice;
    utterance.rate = 1.0;

    utterance.onend = () => {
      // Avoid execution if speech was stopped or changed by user interactions
      if (speakingIndexRef.current === index) {
        speakSection(index + 1);
      }
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') {
        console.error("Speech error", e);
        setIsSpeechPlaying(false);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePauseResumeSpeech = () => {
    if (isSpeechPlaying) {
      window.speechSynthesis.pause();
      setIsSpeechPlaying(false);
    } else {
      if (speakingSceneIndex === -2) {
        speakSection(-1);
      } else {
        window.speechSynthesis.resume();
        setIsSpeechPlaying(true);
      }
    }
  };

  const handleStopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeechPlaying(false);
    setSpeakingSceneIndex(-2);
  };

  const handleCopy = () => {
    let fullText = '';
    if (isBonusScript) {
      fullText = `TITLE: ${scriptData.title}\nAUDIENCE: ${scriptData.audience}\nESTIMATED DURATION: ${scriptData.estimatedDuration}\n\n`;
      fullText += `[INTRODUCTION]\n${scriptData.introduction}\n\n`;
      scriptData.scenes.forEach(scene => {
        fullText += `[SCENE ${scene.sceneNumber}: ${scene.sectionTitle}] (Duration: ${scene.duration})\n`;
        fullText += `Visuals: ${scene.visuals}\n`;
        fullText += `Text Overlay: ${scene.overlayText}\n`;
        fullText += `Narration: "${scene.narration}"\n\n`;
      });
      fullText += `[OUTRO]\n${scriptData.outro}`;
    } else {
      fullText = scriptData; // Direct string for basic script
    }

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setIsPlaying(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  // Convert basic script string into array of lines for cleaner rendering if basic mode
  const renderBasicScript = () => {
    if (typeof scriptData !== 'string') return null;
    return scriptData.split('\n\n').map((para, idx) => (
      <p key={idx} className="text-sap-text text-sm leading-relaxed mb-4">
        {para}
      </p>
    ));
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-sap-border shadow-glow-blue relative">
      {/* TTS Audio Narrator Playback Controller */}
      {isBonusScript && (
        <div className="mb-6 p-4 rounded-xl border border-sap-border bg-[#17203b]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sap-blue/20 border border-sap-accent/40 flex items-center justify-center text-sap-cyan">
              <Film className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-semibold text-sap-muted uppercase tracking-wider block">AI Audio Narrator Studio</span>
              <strong className="text-sm text-white">
                {speakingSceneIndex === -1 ? 'Speaking: Introduction Hook...' :
                 speakingSceneIndex >= 0 && speakingSceneIndex < scriptData.scenes.length ? `Speaking: Scene ${speakingSceneIndex + 1} - ${scriptData.scenes[speakingSceneIndex].sectionTitle}` :
                 speakingSceneIndex === scriptData.scenes.length ? 'Speaking: Outro / Concluding Remarks...' :
                 'AI Voice Synthesis Ready'}
              </strong>
            </div>
          </div>
          
          <div className="flex items-center flex-wrap gap-3">
            {/* Pacing Toggle Selector */}
            <div className="flex items-center gap-1 bg-sap-dark/80 p-1 rounded-xl border border-sap-border/60">
              <button
                type="button"
                onClick={() => setNarratorMode('summary')}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  narratorMode === 'summary'
                    ? 'bg-sap-cyan text-sap-dark font-extrabold shadow-glow-cyan'
                    : 'text-sap-muted hover:text-white'
                }`}
              >
                30s AI Summary
              </button>
              <button
                type="button"
                onClick={() => setNarratorMode('full')}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  narratorMode === 'full'
                    ? 'bg-sap-accent text-white font-extrabold shadow-glow-blue'
                    : 'text-sap-muted hover:text-white'
                }`}
              >
                Full Script (4m)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePauseResumeSpeech}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isSpeechPlaying
                    ? 'bg-sap-accent border-sap-accent text-white shadow-glow-blue'
                    : 'bg-sap-cyan/10 border-sap-cyan/30 text-sap-cyan hover:bg-sap-cyan/20'
                }`}
              >
                {isSpeechPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause Voice</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>{speakingSceneIndex === -2 ? 'Start Spoken Guide' : 'Resume Voice'}</span>
                  </>
                )}
              </button>
              
              {speakingSceneIndex !== -2 && (
                <button
                  onClick={handleStopSpeech}
                  className="bg-sap-dark hover:bg-sap-card border border-sap-border text-sap-muted hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  <span>Stop</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-sap-cyan" />
            {isBonusScript ? scriptData.title : "Training Video Narration Script"}
          </h3>
          {isBonusScript && (
            <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-sap-muted">
              <span className="flex items-center gap-1 font-medium bg-[#17203b] border border-sap-border py-0.5 px-2 rounded">
                <BookOpen className="w-3.5 h-3.5 text-sap-cyan" /> Target: {scriptData.audience}
              </span>
              <span className="flex items-center gap-1 font-medium bg-[#17203b] border border-sap-border py-0.5 px-2 rounded">
                <Clock className="w-3.5 h-3.5 text-sap-accent" /> Est. Time: {scriptData.estimatedDuration}
              </span>
            </div>
          )}
        </div>

        {/* Display Toggles */}
        <div className="flex items-center gap-2 no-print self-end">
          {isBonusScript && (
            <button
              onClick={() => {
                setIsPlaying(false);
                setTeleprompterMode(!teleprompterMode);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                teleprompterMode
                  ? 'bg-sap-cyan/20 border-sap-cyan text-white shadow-glow-cyan'
                  : 'bg-sap-card border-sap-border text-sap-muted hover:text-white'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>{teleprompterMode ? "Storyboard Mode" : "Teleprompter View"}</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-sap-dark border border-sap-border hover:border-sap-cyan text-sap-text hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-sap-cyan" />
                <span>Copy Script</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* TELEPROMPTER VIEW MODE */}
      {teleprompterMode && isBonusScript ? (
        <div className="space-y-4 no-print">
          <div className="bg-[#070a14] border border-sap-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 teleprompter-controls">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-sap-cyan text-sap-dark hover:bg-white hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-lg"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-sap-dark" /> : <Play className="w-5 h-5 fill-sap-dark ml-0.5" />}
              </button>
              
              <button
                onClick={handleReset}
                className="w-10 h-10 rounded-full bg-[#1b254b] hover:bg-[#233164] border border-sap-border text-sap-cyan transition-all flex items-center justify-center"
                title="Reset Teleprompter"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Scroll speed tuner */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-sap-muted font-medium">Scroll Pacing:</span>
              <div className="flex items-center gap-2">
                {[15, 25, 40].map((speed, idx) => (
                  <button
                    key={idx}
                    onClick={() => setScrollSpeed(speed)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                      scrollSpeed === speed
                        ? 'bg-sap-accent border-sap-accent text-white shadow-glow-blue'
                        : 'bg-sap-card border-sap-border text-sap-muted hover:text-white'
                    }`}
                  >
                    {speed === 15 ? 'Slow' : speed === 25 ? 'Medium' : 'Fast'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Teleprompter text scrollbox */}
          <div
            ref={scrollContainerRef}
            className="h-[350px] overflow-y-auto bg-[#070a14] border border-sap-border/80 rounded-2xl px-8 py-16 teleprompter-container select-none font-sans font-medium"
          >
            <div className="max-w-xl mx-auto space-y-12 pb-32">
              <div className="text-center border-b border-sap-border/40 pb-6">
                <h4 className="text-sap-cyan text-sm uppercase tracking-widest font-bold font-display">STARTING NARRATION</h4>
                <p className="text-xs text-sap-muted mt-2">Adjust speed above or click play to start</p>
              </div>

              {/* Intro Narration */}
              <div className={`text-center transition-all duration-300 p-4 rounded-xl ${
                speakingSceneIndex === -1 ? 'bg-sap-cyan/10 border border-sap-cyan/30 scale-105' : ''
              }`}>
                <p className={`text-xl md:text-2xl leading-relaxed ${
                  speakingSceneIndex === -1 ? 'text-white font-bold' : 'text-sap-text'
                }`}>
                  {scriptData.introduction}
                </p>
              </div>

              {/* Story scenes */}
              {scriptData.scenes.map((scene, idx) => (
                <div key={idx} className={`space-y-6 pt-6 border-t border-sap-border/20 transition-all duration-300 p-4 rounded-xl ${
                  speakingSceneIndex === idx ? 'bg-sap-accent/10 border border-sap-accent/30 scale-105' : ''
                }`}>
                  <div className="text-center">
                    <span className={`text-xs font-bold font-display uppercase tracking-widest border py-1 px-3.5 rounded-full ${
                      speakingSceneIndex === idx 
                        ? 'bg-sap-accent text-white border-white shadow-glow-blue'
                        : 'bg-[#17203b] text-sap-cyan border-sap-border'
                    }`}>
                      Scene {scene.sceneNumber}: {scene.sectionTitle}
                    </span>
                  </div>
                  <p className={`text-xl md:text-2xl leading-relaxed text-center ${
                    speakingSceneIndex === idx ? 'text-white font-bold' : 'text-sap-text font-semibold'
                  }`}>
                    {scene.narration}
                  </p>
                </div>
              ))}

              {/* Outro Narration */}
              <div className={`text-center pt-6 border-t border-sap-border/20 transition-all duration-300 p-4 rounded-xl ${
                speakingSceneIndex === scriptData.scenes.length ? 'bg-sap-cyan/10 border border-sap-cyan/30 scale-105' : ''
              }`}>
                <h4 className="text-sap-cyan text-sm uppercase tracking-widest font-bold font-display mb-4">OUTRO</h4>
                <p className={`text-xl md:text-2xl leading-relaxed ${
                  speakingSceneIndex === scriptData.scenes.length ? 'text-white font-bold' : 'text-sap-text font-semibold'
                }`}>
                  {scriptData.outro}
                </p>
              </div>

              <div className="text-center text-sap-muted text-xs font-bold pt-8 border-t border-sap-border/20">
                ■ END OF TRAINING VIDEO SCRIPT
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD STORYBOARD MODE */
        <div className="space-y-6">
          {isBonusScript ? (
            <div className="space-y-6">
              {/* Timeline Sequence Selector Row */}
              <div className="flex items-center overflow-x-auto gap-2 pb-3.5 mb-2 border-b border-sap-border/40 scrollbar-thin no-print">
                <button
                  type="button"
                  onClick={() => setSelectedSceneIndex(-1)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex-shrink-0 flex items-center gap-1.5 active:scale-[0.98] ${
                    selectedSceneIndex === -1
                      ? 'bg-sap-cyan text-sap-dark border-sap-cyan shadow-glow-cyan'
                      : 'bg-sap-dark border-sap-border text-sap-muted hover:text-white'
                  }`}
                >
                  <span>1. Intro Hook</span>
                </button>

                {scriptData.scenes.map((scene, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSceneIndex(idx)}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex-shrink-0 flex items-center gap-1.5 active:scale-[0.98] ${
                      selectedSceneIndex === idx
                        ? 'bg-sap-accent text-white border-sap-accent shadow-glow-blue'
                        : 'bg-sap-dark border-sap-border text-sap-muted hover:text-white'
                    }`}
                  >
                    <span>Scene {scene.sceneNumber}</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setSelectedSceneIndex(scriptData.scenes.length)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex-shrink-0 flex items-center gap-1.5 active:scale-[0.98] ${
                    selectedSceneIndex === scriptData.scenes.length
                      ? 'bg-sap-cyan text-sap-dark border-sap-cyan shadow-glow-cyan'
                      : 'bg-sap-dark border-sap-border text-sap-muted hover:text-white'
                  }`}
                >
                  <span>{scriptData.scenes.length + 2}. Outro Conclusion</span>
                </button>
              </div>

              {/* Studio Editor split screen workspace */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch no-print">
                {/* Left Panel: Simulated Screen Viewport / Flowchart */}
                <div className="flex flex-col gap-3 h-full min-h-[460px]">
                  {/* Left panel mini tab headers */}
                  <div className="flex items-center justify-between bg-sap-card border border-sap-border p-2 rounded-xl flex-shrink-0">
                    <div className="flex gap-1 bg-sap-dark p-0.5 rounded-lg border border-sap-border/60">
                      <button
                        type="button"
                        onClick={() => setLeftPanelTab('flowchart')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all ${
                          leftPanelTab === 'flowchart'
                            ? 'bg-sap-accent text-white font-extrabold shadow-glow-blue'
                            : 'text-sap-muted hover:text-white'
                        }`}
                      >
                        Video Flowchart
                      </button>
                      <button
                        type="button"
                        onClick={() => setLeftPanelTab('viewport')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all ${
                          leftPanelTab === 'viewport'
                            ? 'bg-sap-cyan text-sap-dark font-extrabold shadow-glow-cyan'
                            : 'text-sap-muted hover:text-white'
                        }`}
                      >
                        Viewport Sandbox
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-sap-cyan/70 tracking-wider px-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sap-cyan animate-pulse"></span>
                      <span>Studio Viewport</span>
                    </div>
                  </div>

                  {leftPanelTab === 'viewport' ? (
                    <div className="flex-1 flex flex-col">
                      <InteractiveSandbox 
                        steps={scriptData.scenes.map(s => ({
                          title: s.sectionTitle,
                          description: s.narration,
                          screen: s.visuals
                        }))}
                        data={scriptData}
                        topicName={topicName}
                        activeStepIndex={selectedSceneIndex}
                        onStepActive={(idx) => setSelectedSceneIndex(idx)}
                        isAutoPlaying={isSpeechPlaying}
                        onAutoPlayToggle={handlePauseResumeSpeech}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 glass-panel p-5 rounded-2xl border border-sap-border bg-[#050811] flex flex-col justify-between relative overflow-hidden shadow-inner">
                      <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[280px] pr-2 scrollbar-thin py-1 text-left">
                        {/* Intro Flow Node */}
                        <div
                          onClick={() => setSelectedSceneIndex(-1)}
                          className={`cursor-pointer p-2.5 rounded-xl border transition-all flex items-center gap-2.5 relative ${
                            selectedSceneIndex === -1
                              ? 'border-sap-cyan bg-sap-cyan/10 shadow-glow-cyan'
                              : 'border-sap-border/50 bg-sap-dark/30 hover:border-sap-cyan/40'
                          }`}
                        >
                          <div className="w-6 h-6 rounded-full bg-sap-blue/20 border border-sap-accent/40 flex items-center justify-center text-[10px] font-bold text-sap-cyan">
                            I
                          </div>
                          <div className="flex-1">
                            <strong className="text-[11px] text-white block">Introduction</strong>
                            <span className="text-[9px] text-sap-muted block truncate max-w-[200px]">Hooking the audience</span>
                          </div>
                          {selectedSceneIndex === -1 && <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-sap-cyan animate-ping"></span>}
                        </div>

                        {/* Connection Arrow */}
                        <div className="h-2 w-0.5 bg-sap-border/60 ml-5 -my-1"></div>

                        {/* Scene Nodes */}
                        {scriptData.scenes.map((scene, idx) => (
                          <React.Fragment key={idx}>
                            <div
                              onClick={() => setSelectedSceneIndex(idx)}
                              className={`cursor-pointer p-2.5 rounded-xl border transition-all flex items-center gap-2.5 relative ${
                                selectedSceneIndex === idx
                                  ? 'border-sap-accent bg-sap-accent/10 shadow-glow-blue'
                                  : 'border-sap-border/50 bg-sap-dark/30 hover:border-sap-accent/40'
                              }`}
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                selectedSceneIndex === idx ? 'bg-sap-accent text-white' : 'bg-sap-dark border border-sap-border text-sap-muted'
                              }`}>
                                {scene.sceneNumber}
                              </div>
                              <div className="flex-1">
                                <strong className="text-[11px] text-white block truncate max-w-[190px]">{scene.sectionTitle}</strong>
                                <span className="text-[9px] text-sap-muted block">Duration: {scene.duration}</span>
                              </div>
                              {selectedSceneIndex === idx && <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-sap-accent animate-ping"></span>}
                            </div>

                            {/* Connection Arrow */}
                            <div className="h-2 w-0.5 bg-sap-border/60 ml-5 -my-1"></div>
                          </React.Fragment>
                        ))}

                        {/* Outro Flow Node */}
                        <div
                          onClick={() => setSelectedSceneIndex(scriptData.scenes.length)}
                          className={`cursor-pointer p-2.5 rounded-xl border transition-all flex items-center gap-2.5 relative ${
                            selectedSceneIndex === scriptData.scenes.length
                              ? 'border-sap-cyan bg-sap-cyan/10 shadow-glow-cyan'
                              : 'border-sap-border/50 bg-sap-dark/30 hover:border-sap-cyan/40'
                          }`}
                        >
                          <div className="w-6 h-6 rounded-full bg-[#1b254b] border border-sap-border flex items-center justify-center text-[10px] font-bold text-sap-cyan">
                            O
                          </div>
                          <div className="flex-1">
                            <strong className="text-[11px] text-white block">Outro</strong>
                            <span className="text-[9px] text-sap-muted block truncate max-w-[200px]">Key takeaways & Conclusion</span>
                          </div>
                          {selectedSceneIndex === scriptData.scenes.length && <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-sap-cyan animate-ping"></span>}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] text-sap-muted border-t border-sap-border/20 pt-2.5 flex-shrink-0">
                        <span>Timeline Navigator</span>
                        <span>Total Scenes: {scriptData.scenes.length}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Panel: Teleprompter Speech Box */}
                <div className="glass-panel p-5 rounded-2xl border border-sap-border flex flex-col justify-between min-h-[300px] space-y-4">
                  <div className="flex justify-between items-center border-b border-sap-border/40 pb-2">
                    <span className="text-[10px] uppercase font-bold text-sap-cyan tracking-wider">
                      {selectedSceneIndex === -1 ? "Introduction Hook Script" :
                       selectedSceneIndex === scriptData.scenes.length ? "Outro Conclusion Script" :
                       `Scene ${selectedSceneIndex + 1} Narration`}
                    </span>
                    <span className="text-[10px] text-sap-muted">
                      Speech rate: 1.0x
                    </span>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center select-text">
                    <p className="text-sm text-white font-medium leading-relaxed italic bg-sap-dark/30 p-4 rounded-xl border border-sap-border/20">
                      "{selectedSceneIndex === -1 ? scriptData.introduction :
                        selectedSceneIndex === scriptData.scenes.length ? scriptData.outro :
                        scriptData.scenes[selectedSceneIndex].narration}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-sap-border/20 flex justify-between items-center gap-2">
                    <button
                      type="button"
                      onClick={() => speakSection(selectedSceneIndex)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border active:scale-[0.98] ${
                        speakingSceneIndex === selectedSceneIndex
                          ? 'bg-sap-accent border-sap-accent text-white shadow-glow-blue'
                          : 'bg-sap-cyan/15 border-sap-cyan/30 text-sap-cyan hover:bg-sap-cyan/25'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{speakingSceneIndex === selectedSceneIndex ? 'Speaking Scene...' : 'Speak Scene Only'}</span>
                    </button>
                    
                    <span className="text-[10px] text-sap-muted text-right max-w-[180px] leading-relaxed">
                      Click current scene speak or use main "Start Spoken Guide" to autoplay.
                    </span>
                  </div>
                </div>
              </div>

              {/* Renders complete list during export / printing */}
              <div className="hidden print:block space-y-8">
                <div className="p-4 rounded-xl border border-sap-border bg-sap-dark/50">
                  <h4 className="text-xs font-bold text-sap-cyan uppercase tracking-widest mb-2 font-display">Introduction Narrator Hook</h4>
                  <p className="text-sm text-sap-text leading-relaxed">{scriptData.introduction}</p>
                </div>
                
                <div className="space-y-4">
                  {scriptData.scenes.map((scene, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-sap-border bg-[#121829] flex gap-4 print-avoid-split">
                      <div className="w-1/4 pr-4 border-r border-sap-border">
                        <span className="text-sap-cyan text-xs font-bold font-display">SCENE {scene.sceneNumber}</span>
                        <h5 className="text-xs font-bold text-white mt-1">{scene.sectionTitle}</h5>
                        <span className="block text-[10px] text-sap-muted mt-2">Duration: {scene.duration}</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-xs text-sap-muted italic"><strong>Visuals:</strong> {scene.visuals}</p>
                        {scene.overlayText && <code className="block p-1 bg-[#070a14] rounded text-[10px] text-sap-cyan font-mono">{scene.overlayText}</code>}
                        <p className="text-sm text-sap-text font-medium">"{scene.narration}"</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl border border-sap-border bg-sap-dark/50">
                  <h4 className="text-xs font-bold text-sap-cyan uppercase tracking-widest mb-2 font-display">Outro Narration Script</h4>
                  <p className="text-sm text-sap-text leading-relaxed">{scriptData.outro}</p>
                </div>
              </div>
            </div>
          ) : (
            /* Fallback to basic narration */
            <div className="p-4 rounded-xl border border-sap-border bg-sap-dark/50 whitespace-pre-line text-sm leading-relaxed text-sap-text">
              {renderBasicScript()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { MyraaAudioSession, LiveState } from "../lib/audio";
import { CharacterType } from "./MyraaCoreVisualizer";

interface WaveformPeakVisualizerProps {
  session: MyraaAudioSession | null;
  state: LiveState;
  character: CharacterType;
}

const BAR_COUNT = 16;
const PEAK_HOLD_FRAMES = 15; // ~250ms at 60fps
const PEAK_DECAY_RATE = 0.025; // Smooth gravity drop

export const WaveformPeakVisualizer: React.FC<WaveformPeakVisualizerProps> = ({
  session,
  state,
  character,
}) => {
  const [barHeights, setBarHeights] = useState<number[]>(() => new Array(BAR_COUNT).fill(0.08));
  const [peakCaps, setPeakCaps] = useState<number[]>(() => new Array(BAR_COUNT).fill(0.1));
  const [masterPeakLevel, setMasterPeakLevel] = useState<number>(0);
  const [dbReadout, setDbReadout] = useState<string>("-∞ dB");

  // Physics refs to prevent state lag across 60fps animation frames
  const peaksRef = useRef<number[]>(new Array(BAR_COUNT).fill(0.1));
  const holdCountersRef = useRef<number[]>(new Array(BAR_COUNT).fill(0));
  const masterPeakRef = useRef<number>(0);
  const masterHoldCounterRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let phase = 0;

    const updateLoop = () => {
      phase += 0.06;

      const isLive = state === "listening" || state === "speaking";
      let freqs: number[] = [];
      let currentMax = 0;

      if (isLive && session) {
        // Query microphone when listening (or output speaker when speaking)
        const targetType = state === "speaking" ? "output" : "input";
        freqs = session.getFrequencyData(targetType, BAR_COUNT);
        
        // Also query true peak time-domain amplitude from microphone or speaker
        const isSpeaking = state === "speaking";
        const rawPeak = isSpeaking ? session.getOutputPeak() : session.getInputPeak();
        const rawAmp = isSpeaking ? session.getOutputAmplitude() : session.getInputAmplitude();
        currentMax = Math.max(
          Number.isFinite(rawPeak) ? rawPeak : 0, 
          (Number.isFinite(rawAmp) ? rawAmp : 0) * 1.5
        );
      }

      const nextHeights: number[] = [];
      const nextPeaks: number[] = [];

      for (let i = 0; i < BAR_COUNT; i++) {
        let targetLevel = 0.06;

        if (isLive && freqs.length > 0) {
          const rawVal = Number.isFinite(freqs[i]) ? freqs[i] : 0;
          const voiceWeight = 0.8 + Math.sin((i / (BAR_COUNT - 1)) * Math.PI) * 0.7;
          targetLevel = Math.min(1.0, Math.max(0.06, rawVal * 1.4 * voiceWeight));
        } else if (state === "connecting") {
          targetLevel = 0.15 + Math.sin(phase * 2 + i * 0.4) * 0.12;
        } else {
          // Idle resting ambient ripple
          targetLevel = 0.06 + Math.sin(phase + i * 0.3) * 0.04;
        }

        if (!Number.isFinite(targetLevel)) targetLevel = 0.06;
        nextHeights.push(targetLevel);

        // --- Peak-Hold & Gravity Decay Physics ---
        let currentPeak = Number.isFinite(peaksRef.current[i]) ? peaksRef.current[i] : 0.06;
        let holdCount = holdCountersRef.current[i] || 0;

        if (targetLevel >= currentPeak) {
          // Instant snap to new peak crest
          currentPeak = targetLevel;
          holdCount = PEAK_HOLD_FRAMES;
        } else {
          if (holdCount > 0) {
            holdCount--;
          } else {
            // Decay down smoothly with gravity
            currentPeak = Math.max(targetLevel, currentPeak - PEAK_DECAY_RATE);
          }
        }

        peaksRef.current[i] = currentPeak;
        holdCountersRef.current[i] = holdCount;
        nextPeaks.push(currentPeak);
      }

      // Master Peak Meter calculation
      const validHeights = nextHeights.filter(h => Number.isFinite(h));
      const instantMaster = Math.min(1.0, Math.max(
        Number.isFinite(currentMax) ? currentMax : 0, 
        ...(validHeights.length ? validHeights : [0])
      ));

      if (instantMaster >= masterPeakRef.current) {
        masterPeakRef.current = instantMaster;
        masterHoldCounterRef.current = PEAK_HOLD_FRAMES + 8;
      } else {
        if (masterHoldCounterRef.current > 0) {
          masterHoldCounterRef.current--;
        } else {
          masterPeakRef.current = Math.max(instantMaster, masterPeakRef.current - 0.03);
        }
      }

      const safePeak = Number.isFinite(masterPeakRef.current) ? Math.max(0, Math.min(1, masterPeakRef.current)) : 0;

      // Decibel approximation
      let dbStr = "-∞ dB";
      if (isLive && instantMaster > 0.02) {
        // Convert normalized linear amplitude to dBFS range (~ -48dB to 0dB)
        const db = Math.round(20 * Math.log10(Math.max(0.001, instantMaster)));
        dbStr = `${Math.max(-48, Math.min(0, Number.isFinite(db) ? db : -48))} dB`;
      } else if (isLive) {
        dbStr = "-42 dB";
      }

      setBarHeights(nextHeights);
      setPeakCaps(nextPeaks);
      setMasterPeakLevel(safePeak);
      setDbReadout(dbStr);

      animFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [session, state]);

  // Color profiles matching characters
  const getColors = () => {
    if (character === "goku") {
      return {
        barGradient: "from-amber-500 via-yellow-400 to-amber-300",
        barActive: "bg-amber-400",
        peakCap: "bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.9)]",
        meterActive: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]",
        textAccent: "text-amber-400",
        meterBg: "bg-amber-950/40 border-amber-500/20",
      };
    }
    if (character === "robot") {
      return {
        barGradient: "from-blue-600 via-cyan-400 to-teal-300",
        barActive: "bg-cyan-400",
        peakCap: "bg-cyan-200 shadow-[0_0_8px_rgba(34,211,238,0.9)]",
        meterActive: "bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]",
        textAccent: "text-cyan-400",
        meterBg: "bg-cyan-950/40 border-cyan-500/20",
      };
    }
    return {
      barGradient: "from-indigo-500 via-purple-400 to-pink-400",
      barActive: "bg-purple-400",
      peakCap: "bg-pink-300 shadow-[0_0_8px_rgba(244,114,182,0.9)]",
      meterActive: "bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.6)]",
      textAccent: "text-purple-400",
      meterBg: "bg-purple-950/40 border-purple-500/20",
    };
  };

  const colors = getColors();
  const maxDisplayHeight = 36; // pixels

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div className="flex items-center gap-3">
        {/* Left Precision Segmented VU Peak Rail */}
        <div 
          className={`flex flex-col justify-end w-1.5 h-9 rounded-full overflow-hidden p-0.5 border ${colors.meterBg} backdrop-blur-md`}
          title="Master Left Peak Channel"
        >
          <div 
            className={`w-full rounded-full transition-all duration-75 ${
              state === "disconnected" ? "bg-white/10" : colors.meterActive
            }`}
            style={{ height: `${Math.max(8, masterPeakLevel * 100)}%` }}
          />
        </div>

        {/* Central Audio Waveform Bars with Floating Peak-Hold Caps */}
        <div 
          className="relative flex items-end justify-center gap-1 h-10 px-3 py-1 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md shadow-inner"
          style={{ width: `${BAR_COUNT * 8 + 24}px` }}
        >
          {barHeights.map((normHeight, idx) => {
            const barPixelHeight = Math.max(3, normHeight * maxDisplayHeight);
            const peakPixelHeight = Math.max(barPixelHeight + 2, peakCaps[idx] * maxDisplayHeight);

            return (
              <div
                key={idx}
                className="relative flex flex-col justify-end items-center w-1 h-full"
              >
                {/* Floating Peak-Meter Cap Line (Decays with gravity) */}
                {state !== "disconnected" && (
                  <div
                    className={`absolute w-1.5 h-0.5 rounded-full transition-transform duration-75 ${colors.peakCap}`}
                    style={{
                      bottom: `${Math.min(maxDisplayHeight - 1, peakPixelHeight)}px`,
                    }}
                  />
                )}

                {/* Main Dynamic Waveform Bar */}
                <div
                  className={`w-1 rounded-full transition-all duration-75 ${
                    state === "disconnected"
                      ? "bg-white/10"
                      : state === "speaking"
                      ? `bg-gradient-to-t ${colors.barGradient}`
                      : colors.barActive
                  }`}
                  style={{
                    height: `${barPixelHeight}px`,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Right Precision Segmented VU Peak Rail */}
        <div 
          className={`flex flex-col justify-end w-1.5 h-9 rounded-full overflow-hidden p-0.5 border ${colors.meterBg} backdrop-blur-md`}
          title="Master Right Peak Channel"
        >
          <div 
            className={`w-full rounded-full transition-all duration-75 ${
              state === "disconnected" ? "bg-white/10" : colors.meterActive
            }`}
            style={{ height: `${Math.max(8, masterPeakLevel * 100)}%` }}
          />
        </div>
      </div>

      {/* Discrete Real-Time Audio Telemetry Readout */}
      <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-slate-400">
        <span className="flex items-center gap-1">
          <span 
            className={`w-1.5 h-1.5 rounded-full ${
              state === "listening" 
                ? "bg-emerald-400 animate-pulse" 
                : state === "speaking" 
                ? colors.textAccent
                : "bg-white/20"
            }`} 
          />
          <span className="uppercase text-white/50">
            {state === "listening" ? "MIC PEAK" : state === "speaking" ? "VOICE OUT" : "LEVEL"}
          </span>
        </span>
        <span aria-hidden="true" className="text-white/20">·</span>
        <span className={`font-semibold tabular-nums ${colors.textAccent}`}>
          {state === "disconnected" ? "OFFLINE" : dbReadout}
        </span>
        <span aria-hidden="true" className="text-white/20">·</span>
        <span className="text-white/40 tabular-nums">
          {Math.round(masterPeakLevel * 100)}%
        </span>
      </div>
    </div>
  );
};

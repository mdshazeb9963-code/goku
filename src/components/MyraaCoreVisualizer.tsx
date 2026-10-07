import React, { useEffect, useRef, useState } from "react";
import { MyraaAudioSession, LiveState } from "../lib/audio";
import { Sparkles, Zap, Bot, Shield, Cpu } from "lucide-react";
import gokuAvatarIdle from "../assets/images/goku_avatar_idle_1791393232571.jpg";
import gokuAvatarPower from "../assets/images/goku_avatar_power_1791393245294.jpg";
import robotAvatarIdle from "../assets/images/robot_avatar_idle_1791393256699.jpg";
import robotAvatarActive from "../assets/images/robot_avatar_active_1791393272896.jpg";

export type MyraaEmotion = 
  | "idle" 
  | "happy" 
  | "excited" 
  | "curious" 
  | "thinking" 
  | "proud" 
  | "sad" 
  | "confused" 
  | "surprised" 
  | "embarrassed" 
  | "playful";

export type CharacterType = "goku" | "robot" | "girl";

interface MyraaCoreVisualizerProps {
  session: MyraaAudioSession | null;
  state: LiveState;
  themeColor: string; // Violet, crimson, emerald, celestial, gold, rose, charcoal
  activeEmotion?: MyraaEmotion;
  characterState: "idle" | "thinking" | "talking";
  character?: CharacterType;
}

export const MyraaCoreVisualizer: React.FC<MyraaCoreVisualizerProps> = ({
  session,
  state,
  themeColor,
  activeEmotion = "idle",
  characterState,
  character = "goku",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Video element refs for character state machine (Girl)
  const idleVideoRef = useRef<HTMLVideoElement | null>(null);
  const thinkingVideoRef = useRef<HTMLVideoElement | null>(null);
  const talkingVideoRef = useRef<HTMLVideoElement | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);

  const handleVideoError = (videoName: string) => {
    console.warn(`[Myraa Web Video] Failed to load video source for: ${videoName}`);
    setHasError(true);
  };

  // Interaction and tracking references
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.4 });
  const targetMouseRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.4 });
  
  // Physics & Animation states
  const speechVolumeRef = useRef<number>(0);

  // Floating sci-fi background particle arrays
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    speed: number;
    size: number;
    opacity: number;
    color?: string;
  }>>([]);

  // Electrical spark arcs for Goku / Robot
  const sparksRef = useRef<Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    ttl: number;
    color: string;
  }>>([]);

  // Synchronized video playback state manager for Girl
  useEffect(() => {
    if (character !== "girl") return;

    const playVideo = (videoEl: HTMLVideoElement | null) => {
      if (!videoEl) return;
      try {
        videoEl.currentTime = 0;
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.warn("Autoplay block detected, retrying muted play:", error);
          });
        }
      } catch (err) {}
    };

    const pauseVideo = (videoEl: HTMLVideoElement | null) => {
      if (!videoEl) return;
      try {
        videoEl.pause();
      } catch (err) {}
    };

    if (characterState === "idle") {
      playVideo(idleVideoRef.current);
      pauseVideo(thinkingVideoRef.current);
      pauseVideo(talkingVideoRef.current);
    } else if (characterState === "thinking") {
      playVideo(thinkingVideoRef.current);
      pauseVideo(idleVideoRef.current);
      pauseVideo(talkingVideoRef.current);
    } else if (characterState === "talking") {
      playVideo(talkingVideoRef.current);
      pauseVideo(idleVideoRef.current);
      pauseVideo(thinkingVideoRef.current);
    }
  }, [characterState, character]);

  // Cursor position tracking hook
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetMouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Theme matching mapping function
  const getGlowColors = () => {
    if (character === "goku") {
      return {
        primary: "rgba(250, 204, 21, 1)", // Super Saiyan Golden Yellow
        secondary: "rgba(249, 115, 22, 0.9)", // Fiery Orange
        glow: "rgba(234, 179, 8, 0.8)",
        electric: "rgba(56, 189, 248, 0.9)", // Electric Blue Ki
      };
    }
    if (character === "robot") {
      return {
        primary: "rgba(6, 182, 212, 1)", // Cyan Neon
        secondary: "rgba(59, 130, 246, 0.85)", // Matrix Blue
        glow: "rgba(34, 211, 238, 0.75)",
        electric: "rgba(16, 185, 129, 0.85)", // Quantum Emerald
      };
    }

    switch (themeColor) {
      case "violet":
        return { primary: "rgba(147, 51, 234, 1)", secondary: "rgba(192, 38, 211, 0.8)", glow: "rgba(168, 85, 247, 0.7)", electric: "rgba(232, 121, 249, 0.8)" };
      case "crimson":
        return { primary: "rgba(225, 29, 72, 1)", secondary: "rgba(234, 88, 12, 0.8)", glow: "rgba(244, 63, 94, 0.7)", electric: "rgba(251, 146, 60, 0.8)" };
      case "emerald":
        return { primary: "rgba(5, 150, 105, 1)", secondary: "rgba(13, 148, 136, 0.8)", glow: "rgba(16, 185, 129, 0.7)", electric: "rgba(52, 211, 153, 0.8)" };
      case "celestial":
        return { primary: "rgba(2, 132, 199, 1)", secondary: "rgba(8, 145, 178, 0.8)", glow: "rgba(14, 165, 233, 0.7)", electric: "rgba(56, 189, 248, 0.8)" };
      case "gold":
        return { primary: "rgba(202, 138, 4, 1)", secondary: "rgba(217, 119, 6, 0.8)", glow: "rgba(234, 179, 8, 0.7)", electric: "rgba(253, 224, 71, 0.8)" };
      case "rose":
        return { primary: "rgba(219, 39, 119, 1)", secondary: "rgba(220, 38, 38, 0.8)", glow: "rgba(236, 72, 153, 0.7)", electric: "rgba(244, 114, 182, 0.8)" };
      default:
        return { primary: "rgba(34, 211, 238, 1)", secondary: "rgba(79, 70, 229, 0.8)", glow: "rgba(6, 182, 212, 0.7)", electric: "rgba(129, 140, 248, 0.8)" };
    }
  };

  // Main high speed Canvas graphics rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    // Generate responsive background floating particles
    const generateParticles = () => {
      const count = character === "goku" ? 75 : character === "robot" ? 50 : Math.min(60, Math.floor(width / 24));
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height + height * 0.1,
        speed: (character === "goku" ? Math.random() * 0.7 + 0.3 : Math.random() * 0.35 + 0.12),
        size: character === "goku" ? Math.random() * 2.5 + 1 : Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.6 + 0.2,
      }));
    };

    generateParticles();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      generateParticles();
    };

    window.addEventListener("resize", handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const systemTime = performance.now();
      const colors = getGlowColors();

      // Dynamic Audio analysis fetching from real voice session
      let audioLevel = 0;
      let bufferLength = 64;
      const dataArray = new Uint8Array(bufferLength);
      let activeAnalyser = null;

      if (state === "speaking" && session?.outputAnalyser) {
        activeAnalyser = session.outputAnalyser;
      } else if (state === "listening" && session?.inputAnalyser) {
        activeAnalyser = session.inputAnalyser;
      }

      if (activeAnalyser) {
        try {
          activeAnalyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          audioLevel = sum / bufferLength; // 0 to 255
        } catch (e) {}
      }

      // Smooth amplitude tracking for real-time particle excitation
      speechVolumeRef.current += (audioLevel / 255 - speechVolumeRef.current) * 0.2;

      const baseScale = height / 440;
      const s = Math.max(0.95, Math.min(1.85, baseScale));

      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.05;

      const centerX = width / 2;
      const centerY = height * 0.46;

      // ==========================================
      // GOKU SPECIALIZED RENDERING FX
      // ==========================================
      if (character === "goku") {
        ctx.save();
        // 1. Golden Super Saiyan Ki Ground Shockwave Crater
        const kiRadius = (160 + speechVolumeRef.current * 90) * s;
        const kiGrad = ctx.createRadialGradient(centerX, centerY + 120 * s, 10, centerX, centerY + 120 * s, kiRadius);
        kiGrad.addColorStop(0, "rgba(250, 204, 21, 0.35)");
        kiGrad.addColorStop(0.5, "rgba(249, 115, 22, 0.15)");
        kiGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        
        ctx.fillStyle = kiGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY + 120 * s, kiRadius, 0, Math.PI * 2);
        ctx.fill();

        // 2. Rising Super Saiyan Ki Flames (Golden & Amber Upward Flares)
        particlesRef.current.forEach((p) => {
          const riseSpeed = p.speed * (1.5 + speechVolumeRef.current * 3.5);
          p.y -= riseSpeed;
          p.x += Math.sin(p.y * 0.02 + p.size) * 0.8;

          if (p.y < height * 0.1) {
            p.y = height * 0.85 + Math.random() * 40;
            p.x = centerX + (Math.random() - 0.5) * 360 * s;
          }

          const currentOpacity = p.opacity * Math.min(1, (height - p.y) / (height * 0.4));
          const isGold = Math.random() > 0.3;
          ctx.fillStyle = isGold 
            ? `rgba(250, 204, 21, ${currentOpacity * 0.7})` 
            : `rgba(56, 189, 248, ${currentOpacity * 0.8})`;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * s * (1 + speechVolumeRef.current * 0.6), 0, Math.PI * 2);
          ctx.fill();
        });

        // 3. Super Saiyan Electric Lightning Arcs (when talking or thinking)
        if (characterState === "talking" || characterState === "thinking" || Math.random() < 0.15) {
          if (Math.random() < 0.3) {
            const angle = Math.random() * Math.PI * 2;
            const startDist = 70 * s;
            const endDist = (140 + Math.random() * 60) * s;
            sparksRef.current.push({
              x1: centerX + Math.cos(angle) * startDist,
              y1: centerY + Math.sin(angle) * startDist,
              x2: centerX + Math.cos(angle) * endDist,
              y2: centerY + Math.sin(angle) * endDist,
              ttl: 4,
              color: Math.random() > 0.4 ? "rgba(56, 189, 248, 0.9)" : "rgba(250, 204, 21, 0.95)",
            });
          }
        }

        // Render & decay electric sparks
        for (let i = sparksRef.current.length - 1; i >= 0; i--) {
          const spark = sparksRef.current[i];
          ctx.strokeStyle = spark.color;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(spark.x1, spark.y1);
          // Zig-zag midpoint
          const midX = (spark.x1 + spark.x2) / 2 + (Math.random() - 0.5) * 20;
          const midY = (spark.y1 + spark.y2) / 2 + (Math.random() - 0.5) * 20;
          ctx.lineTo(midX, midY);
          ctx.lineTo(spark.x2, spark.y2);
          ctx.stroke();

          spark.ttl--;
          if (spark.ttl <= 0) {
            sparksRef.current.splice(i, 1);
          }
        }

        ctx.restore();
      }

      // ==========================================
      // ROBOT SPECIALIZED RENDERING FX
      // ==========================================
      else if (character === "robot") {
        ctx.save();
        // 1. Cybernetic Holographic Target Reticle around center
        const reticleRadius = (170 + speechVolumeRef.current * 50) * s;
        const rotAngle = (systemTime * 0.0006) % (Math.PI * 2);

        ctx.strokeStyle = "rgba(6, 182, 212, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, reticleRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Rotating dashed tactical ring
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotAngle);
        ctx.setLineDash([8, 12]);
        ctx.strokeStyle = "rgba(34, 211, 238, 0.4)";
        ctx.beginPath();
        ctx.arc(0, 0, reticleRadius + 18 * s, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // 2. Audio-reactive Sonic Frequency Equalizer Rings (when talking)
        if (speechVolumeRef.current > 0.05) {
          const pulseR = reticleRadius * (1 + speechVolumeRef.current * 0.4);
          ctx.strokeStyle = `rgba(6, 182, 212, ${speechVolumeRef.current * 0.6})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, pulseR, 0, Math.PI * 2);
          ctx.stroke();
        }

        // 3. Ascending Cyber Telemetry Packets
        particlesRef.current.forEach((p) => {
          p.y -= p.speed * (1.2 + speechVolumeRef.current * 2);
          if (p.y < height * 0.15) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }

          ctx.fillStyle = `rgba(6, 182, 212, ${p.opacity * 0.5})`;
          ctx.fillRect(p.x, p.y, p.size * s * 1.5, p.size * s * 1.5);
        });

        // 4. Subtle Scanline sweeping effect (Thinking mode)
        if (characterState === "thinking") {
          const scanY = (systemTime * 0.15) % height;
          const scanGrad = ctx.createLinearGradient(0, scanY - 15, 0, scanY + 15);
          scanGrad.addColorStop(0, "rgba(6, 182, 212, 0)");
          scanGrad.addColorStop(0.5, "rgba(6, 182, 212, 0.18)");
          scanGrad.addColorStop(1, "rgba(6, 182, 212, 0)");
          ctx.fillStyle = scanGrad;
          ctx.fillRect(0, scanY - 15, width, 30);
        }

        ctx.restore();
      }

      // ==========================================
      // ORIGINAL GIRL RENDERING FX
      // ==========================================
      else {
        ctx.save();
        const projectorCenterY = height + 40;
        const baseDiameterX = 280 * s;

        // Volumetric light beams shooting up from projector base
        const conicalBeamGrad = ctx.createLinearGradient(centerX, height * 0.25, centerX, height);
        conicalBeamGrad.addColorStop(0, "rgba(0,0,0,0)");
        conicalBeamGrad.addColorStop(0.4, colors.primary.replace("1)", "0.03)"));
        conicalBeamGrad.addColorStop(0.75, colors.primary.replace("1)", "0.08)"));
        conicalBeamGrad.addColorStop(1, colors.secondary.replace("0.8)", "0.18)"));

        ctx.fillStyle = conicalBeamGrad;
        ctx.beginPath();
        ctx.moveTo(centerX - baseDiameterX * 0.35, projectorCenterY - 145);
        ctx.lineTo(centerX + baseDiameterX * 0.35, projectorCenterY - 145);
        ctx.lineTo(centerX + baseDiameterX * 1.5, height);
        ctx.lineTo(centerX - baseDiameterX * 1.5, height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Particles
        particlesRef.current.forEach((p) => {
          const riseSpeed = p.speed * (1 + speechVolumeRef.current * 1.8);
          p.y -= riseSpeed;
          p.x += Math.sin(p.y * 0.015 + p.size) * 0.4;
          const currentOpacity = p.opacity * Math.max(0, p.y / height);

          if (p.y < height * 0.12) {
            p.y = height + Math.random() * 30;
            p.x = Math.random() * width;
          }

          ctx.fillStyle = colors.primary.replace("1)", `${currentOpacity * 0.45})`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * s, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [session, state, themeColor, activeEmotion, characterState, character]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* 1. Behind Overlay / Atmospheric Backlight Glow (Z-index 0) */}
      <div className="absolute inset-0 bg-transparent flex items-center justify-center pointer-events-none z-0">
        <div className={`w-[520px] h-[520px] rounded-full blur-[140px] transition-all duration-1000 ${
          character === "goku" 
            ? "bg-gradient-to-tr from-amber-500/25 via-yellow-500/20 to-orange-500/10 opacity-40" 
            : character === "robot"
            ? "bg-gradient-to-tr from-cyan-500/25 via-blue-500/20 to-teal-500/10 opacity-35"
            : themeColor === "violet" ? "from-purple-600/30 to-fuchsia-600/5 opacity-25" :
              themeColor === "crimson" ? "from-rose-600/30 to-orange-600/5 opacity-25" :
              themeColor === "emerald" ? "from-emerald-600/30 to-teal-600/5 opacity-25" :
              themeColor === "celestial" ? "from-sky-600/30 to-cyan-600/5 opacity-25" :
              themeColor === "gold" ? "from-amber-600/30 to-yellow-600/5 opacity-25" :
              themeColor === "rose" ? "from-rose-600/30 to-pink-600/5 opacity-25" :
              "from-indigo-600/30 to-cyan-600/5 opacity-25"
        }`} />
      </div>

      {/* 2. Character Presence Display (Z-index 10) */}
      <div 
        id="character-animated-presence"
        className="absolute z-10 w-full h-full flex items-center justify-center pointer-events-auto transition-all duration-700"
      >
        <div className="relative w-full max-w-4xl aspect-[16/9] flex items-center justify-center scale-[0.95] sm:scale-110 select-none pointer-events-none md:max-h-[72vh] max-h-[62vh]">
          
          {/* ========================================================= */}
          {/* GOKU AVATAR CORE */}
          {/* ========================================================= */}
          {character === "goku" && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Outer Golden Aura Glow */}
              <div className={`absolute inset-0 rounded-[2.5rem] blur-[40px] transition-opacity duration-500 ${
                characterState === "talking" 
                  ? "bg-yellow-400/35 opacity-90 scale-105" 
                  : characterState === "thinking"
                  ? "bg-amber-400/25 opacity-70 scale-100"
                  : "bg-yellow-500/15 opacity-50"
              } pointer-events-none mix-blend-screen`} />

              {/* Goku Idle Image */}
              <img
                src="/src/assets/images/goku_avatar_idle_1791393232571.jpg"
                alt="Son Goku (Calm / Idle)"
                referrerPolicy="no-referrer"
                className={`absolute inset-0 w-full h-full object-contain rounded-[2.5rem] transition-all duration-700 ease-in-out ${
                  characterState === "idle" ? "opacity-100 scale-100 z-10" : "opacity-0 scale-95 z-0"
                }`}
                style={{
                  maskImage: "radial-gradient(circle, rgba(0,0,0,1) 58%, rgba(0,0,0,0) 84%)",
                  WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 58%, rgba(0,0,0,0) 84%)",
                }}
              />

              {/* Goku Super Saiyan Powered Image (Active when talking or thinking) */}
              <img
                src="/src/assets/images/goku_avatar_power_1791393245294.jpg"
                alt="Son Goku (Super Saiyan Power)"
                referrerPolicy="no-referrer"
                className={`absolute inset-0 w-full h-full object-contain rounded-[2.5rem] transition-all duration-700 ease-in-out ${
                  characterState === "talking" || characterState === "thinking" 
                    ? "opacity-100 scale-105 z-10" 
                    : "opacity-0 scale-100 z-0"
                }`}
                style={{
                  maskImage: "radial-gradient(circle, rgba(0,0,0,1) 58%, rgba(0,0,0,0) 84%)",
                  WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 58%, rgba(0,0,0,0) 84%)",
                }}
              />

              {/* Character Badge / Tag (Clean unboxed style) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 text-xs font-mono tracking-widest text-amber-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] bg-black/40 px-3 py-1 rounded-full border border-amber-500/20 backdrop-blur-md">
                <Zap size={13} className="text-amber-400 animate-pulse" />
                <span>SON GOKU</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-200/80">
                  {characterState === "talking" ? "SUPER SAIYAN" : characterState === "thinking" ? "CHARGING KI" : "WARRIOR READY"}
                </span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ROBOT AVATAR CORE */}
          {/* ========================================================= */}
          {character === "robot" && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Outer Cyan Sci-Fi Glow */}
              <div className={`absolute inset-0 rounded-[2.5rem] blur-[40px] transition-opacity duration-500 ${
                characterState === "talking" 
                  ? "bg-cyan-400/30 opacity-90 scale-105" 
                  : characterState === "thinking"
                  ? "bg-sky-400/25 opacity-70 scale-100"
                  : "bg-cyan-500/15 opacity-50"
              } pointer-events-none mix-blend-screen`} />

              {/* Robot Idle Image */}
              <img
                src="/src/assets/images/robot_avatar_idle_1791393256699.jpg"
                alt="Robot AI Companion (Idle)"
                referrerPolicy="no-referrer"
                className={`absolute inset-0 w-full h-full object-contain rounded-[2.5rem] transition-all duration-700 ease-in-out ${
                  characterState === "idle" || characterState === "thinking" 
                    ? "opacity-100 scale-100 z-10" 
                    : "opacity-0 scale-95 z-0"
                }`}
                style={{
                  maskImage: "radial-gradient(circle, rgba(0,0,0,1) 58%, rgba(0,0,0,0) 84%)",
                  WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 58%, rgba(0,0,0,0) 84%)",
                }}
              />

              {/* Robot Active / Communicating Image */}
              <img
                src="/src/assets/images/robot_avatar_active_1791393272896.jpg"
                alt="Robot AI Companion (Transmitting)"
                referrerPolicy="no-referrer"
                className={`absolute inset-0 w-full h-full object-contain rounded-[2.5rem] transition-all duration-700 ease-in-out ${
                  characterState === "talking" ? "opacity-100 scale-105 z-10" : "opacity-0 scale-100 z-0"
                }`}
                style={{
                  maskImage: "radial-gradient(circle, rgba(0,0,0,1) 58%, rgba(0,0,0,0) 84%)",
                  WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 58%, rgba(0,0,0,0) 84%)",
                }}
              />

              {/* Robot Telemetry Badge */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 text-xs font-mono tracking-widest text-cyan-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] bg-black/40 px-3 py-1 rounded-full border border-cyan-500/20 backdrop-blur-md">
                <Cpu size={13} className="text-cyan-400 animate-pulse" />
                <span>UNIT NEXUS-9</span>
                <span aria-hidden="true">·</span>
                <span className="text-cyan-200/80">
                  {characterState === "talking" ? "TRANSMITTING" : characterState === "thinking" ? "COMPUTING" : "SYSTEMS NOMINAL"}
                </span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ORIGINAL GIRL (MYRAA) VIDEO AVATAR */}
          {/* ========================================================= */}
          {character === "girl" && (
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute inset-0 rounded-[2.5rem] blur-[30px] opacity-20 bg-cyan-600/15 pointer-events-none mix-blend-screen" />

              {/* IDLE VIDEO */}
              <video
                ref={idleVideoRef}
                src="/assets/idle.mp4"
                loop
                muted
                playsInline
                autoPlay
                className={`absolute inset-0 w-full h-full object-cover rounded-[2.5rem] transition-opacity duration-700 ease-in-out ${
                  characterState === "idle" ? "opacity-100 z-10 animate-fade-in" : "opacity-0 z-0"
                }`}
                style={{
                  maskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                  WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                }}
                onError={() => handleVideoError("idle")}
              />

              {/* THINKING VIDEO */}
              <video
                ref={thinkingVideoRef}
                src="/assets/thinking.mp4"
                loop
                muted
                playsInline
                className={`absolute inset-0 w-full h-full object-cover rounded-[2.5rem] transition-opacity duration-700 ease-in-out ${
                  characterState === "thinking" ? "opacity-100 z-10 animate-fade-in" : "opacity-0 z-0"
                }`}
                style={{
                  maskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                  WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                }}
                onError={() => handleVideoError("thinking")}
              />

              {/* TALKING VIDEO */}
              <video
                ref={talkingVideoRef}
                src="/assets/talking.mp4"
                loop
                muted
                playsInline
                className={`absolute inset-0 w-full h-full object-cover rounded-[2.5rem] transition-opacity duration-700 ease-in-out ${
                  characterState === "talking" ? "opacity-100 z-10 animate-fade-in" : "opacity-0 z-0"
                }`}
                style={{
                  maskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                  WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                }}
                onError={() => handleVideoError("talking")}
              />

              {hasError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#05060f]/90 backdrop-blur-md rounded-3xl p-6 text-center z-50 pointer-events-auto border border-white/5 shadow-2xl animate-fade-in">
                  <Sparkles className="text-cyan-400 mb-2 animate-pulse" size={32} />
                  <h3 className="text-sm font-bold tracking-widest font-mono text-white select-none">AWAITING VIDEOS CORES</h3>
                  <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed font-sans">
                    Please place your character video assets inside the <code className="text-cyan-300 font-mono">/assets</code> directory of your workspace named exactly:
                  </p>
                  <div className="mt-3 space-y-1.5 text-left font-mono text-[10px] text-cyan-200 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
                    <div>• idle.mp4 (State: Idle)</div>
                    <div>• thinking.mp4 (State: Thinking)</div>
                    <div>• talking.mp4 (State: Talking)</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Faint cybernetic visual edge grid guard */}
          <div className="absolute inset-0 rounded-[2.5rem] border border-white/5 pointer-events-none bg-radial-gradient from-transparent to-black/35" />
        </div>
      </div>

      {/* 3. Foreground Hover-Responsive Canvas for glowing particles & aura */}
      <canvas
        id="character-living-canvas"
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
      />
    </div>
  );
};

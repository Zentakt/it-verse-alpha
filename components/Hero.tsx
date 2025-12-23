import React, { useState, useEffect, useCallback, useRef } from 'react';
import VoxelTorch from './VoxelTorch';
import { AppState } from '../types';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { X, ArrowUpRight, Terminal } from 'lucide-react';

interface HeroProps {
  appState: AppState;
  onTorchLight: () => void;
}

const Hero: React.FC<HeroProps> = ({ appState, onTorchLight }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);
  const [showLockScreen, setShowLockScreen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive Check
  useEffect(() => {
    const checkLayout = () => {
        setIsDesktop(window.innerWidth >= 1024);
    };
    checkLayout();
    window.addEventListener('resize', checkLayout);
    return () => window.removeEventListener('resize', checkLayout);
  }, []);

  const calculateTimeLeft = useCallback(() => {
    if (appState.isTorchLit) {
        setShowLockScreen(false);
        return null;
    }
    const now = new Date().getTime();
    const end = new Date(appState.countdownEnd).getTime();
    const difference = end - now;

    if (difference > 0) {
      return {
        d: Math.floor(difference / (1000 * 60 * 60 * 24)),
        h: Math.floor((difference / (1000 * 60 * 60)) % 24),
        m: Math.floor((difference / 1000 / 60) % 60),
        s: Math.floor((difference / 1000) % 60),
      };
    }
    setShowLockScreen(false);
    return null;
  }, [appState.countdownEnd, appState.isTorchLit]);

  useEffect(() => {
    if (containerRef.current) {
        const titleParts = containerRef.current.querySelectorAll('.title-part');
        gsap.fromTo(titleParts, 
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power2.out" }
        );
    }

    const timer = setInterval(() => {
      const tl = calculateTimeLeft();
      setTimeLeft(tl);
      
      if (!tl && !appState.isTorchLit) {
        const diff = new Date(appState.countdownEnd).getTime() - new Date().getTime();
        if (diff <= 0) {
            onTorchLight();
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#7c3aed', '#ff00de', '#00ffff']
            });
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [appState.countdownEnd, appState.isTorchLit, calculateTimeLeft, onTorchLight]);

  // Reusable Countdown Component
  const renderCountdown = (isOverlay: boolean = false) => {
    if (!appState.isTorchLit && timeLeft) {
        return (
            <div className="w-full">
                {/* Maximize Link */}
                <div className={`flex justify-center mb-2`}>
                    <button 
                        onClick={() => setShowLockScreen(true)} 
                        className="text-[10px] font-mono text-purple-400 hover:text-white flex items-center gap-1 transition-colors uppercase tracking-widest group px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/5"
                    >
                        <ArrowUpRight size={12} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform"/> Maximize
                    </button>
                </div>

                {/* Countdown Box */}
                <div className={`relative bg-[#080810]/85 border border-purple-500/30 rounded-2xl p-4 md:p-6 shadow-[0_0_40px_rgba(139,92,246,0.15)] backdrop-blur-md`}>
                    <div className="flex items-center justify-between font-pixel">
                        {/* D */}
                        <div className="flex flex-col items-center">
                            <span className="text-2xl md:text-4xl lg:text-5xl text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                                {String(timeLeft.d).padStart(2, '0')}
                            </span>
                            <span className="text-[8px] md:text-[9px] text-gray-500 font-mono mt-2 tracking-[0.2em] font-bold">DAYS</span>
                        </div>
                        <span className="text-lg md:text-2xl text-gray-800 pb-4">:</span>
                        {/* H */}
                        <div className="flex flex-col items-center">
                            <span className="text-2xl md:text-4xl lg:text-5xl text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                                {String(timeLeft.h).padStart(2, '0')}
                            </span>
                            <span className="text-[8px] md:text-[9px] text-gray-500 font-mono mt-2 tracking-[0.2em] font-bold">HRS</span>
                        </div>
                        <span className="text-lg md:text-2xl text-gray-800 pb-4">:</span>
                        {/* M */}
                        <div className="flex flex-col items-center">
                            <span className="text-2xl md:text-4xl lg:text-5xl text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                                {String(timeLeft.m).padStart(2, '0')}
                            </span>
                            <span className="text-[8px] md:text-[9px] text-gray-500 font-mono mt-2 tracking-[0.2em] font-bold">MINS</span>
                        </div>
                        <span className="text-lg md:text-2xl text-gray-800 pb-4">:</span>
                        {/* S */}
                        <div className="flex flex-col items-center">
                            <span className="text-2xl md:text-4xl lg:text-5xl text-neon-pink drop-shadow-[0_0_10px_rgba(255,0,222,0.6)]">
                                {String(timeLeft.s).padStart(2, '0')}
                            </span>
                            <span className="text-[8px] md:text-[9px] text-gray-500 font-mono mt-2 tracking-[0.2em] font-bold">SECS</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    } 
    return null;
  };

  return (
    <div className="relative w-full min-h-screen bg-[#05050a] overflow-x-hidden flex flex-col justify-center items-center">
      
      {/* --- CONTENT SECTION --- */}
      <div ref={containerRef} className="relative z-20 w-full flex flex-col items-center justify-center px-6 md:px-12 py-12 lg:py-8 bg-[#05050a]">
        
        <div className="flex flex-col items-center relative z-10 w-full max-w-5xl">
            
            {/* Status */}
            <div className="flex items-center gap-3 mb-6 title-part relative z-30">
               <span className="font-mono text-[10px] md:text-xs text-neon-cyan tracking-[0.2em] uppercase bg-purple-900/10 px-3 py-1 rounded border border-purple-500/20">
                   System Status: Initializing...
               </span>
            </div>

            {/* Title (Single Line) */}
            <div className="relative mb-8 group title-part flex flex-col items-center text-center z-30 w-full">
                <div className="flex items-center justify-center gap-2 md:gap-4 font-black text-white font-cyber leading-none">
                    <span className="text-4xl md:text-6xl lg:text-7xl tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] whitespace-nowrap">
                    IT-
                    </span>
                    <span className="glitch-effect text-4xl md:text-6xl lg:text-7xl tracking-tight relative z-10 whitespace-nowrap" data-text="VERSE">
                    VERSE
                    </span>
                </div>
                {/* Blur Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-12 bg-purple-900/40 blur-2xl -z-10"></div>
            </div>

            {/* Subtitle (Centered) */}
            <div className="flex items-center justify-center gap-6 mb-8 title-part z-30">
                <div className="text-4xl md:text-5xl font-black font-pixel text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 drop-shadow-lg">
                    2025
                </div>
            </div>

            {/* --- TORCH & COUNTDOWN AREA --- */}
            
            {/* Unified Torch Layout (Desktop & Mobile) */}
            <div className="w-full flex justify-center items-center relative h-[450px] md:h-[650px] -mt-16 md:-mt-28 mb-8 title-part pointer-events-none">
                {/* Torch Left (Heads Top-Left \) - Positioned slightly left of center */}
                <div className="absolute w-[350px] h-[600px] md:w-[600px] md:h-[850px] left-1/2 -translate-x-[60%] md:-translate-x-[55%] -top-10 md:-top-20 z-0 pointer-events-auto">
                    <VoxelTorch isLit={appState.isTorchLit} isMobile={!isDesktop} tilt={0.75} />
                </div>
                {/* Torch Right (Heads Top-Right /) - Positioned slightly right of center */}
                <div className="absolute w-[350px] h-[600px] md:w-[600px] md:h-[850px] left-1/2 -translate-x-[40%] md:-translate-x-[45%] -top-10 md:-top-20 z-0 pointer-events-auto">
                    <VoxelTorch isLit={appState.isTorchLit} isMobile={!isDesktop} tilt={-0.75} />
                </div>
                
                {/* Countdown centered over torches */}
                <div className="relative z-20 mt-40 md:mt-56 w-full max-w-md pointer-events-auto px-4">
                    {renderCountdown(true)}
                </div>
            </div>

            {/* Description */}
            <div className="title-part mb-12 text-center relative z-20">
                <p className="text-gray-400 font-ui text-xs md:text-sm leading-relaxed tracking-widest uppercase max-w-md mx-auto">
                    The ultimate convergence of code,
                    creativity, and competition. The arena
                    awaits your command.
                </p>
            </div>

        </div>
      </div>

      {/* --- LOCK SCREEN OVERLAY (Expanded Timer) --- */}
      {!appState.isTorchLit && showLockScreen && timeLeft && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#05050a] animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none"></div>
           
           <button 
            onClick={() => setShowLockScreen(false)}
            className="absolute top-8 right-8 text-gray-500 hover:text-white flex items-center gap-2 font-mono text-xs border border-gray-800 hover:border-purple-500 px-4 py-2 bg-black transition-all"
           >
            [ ESC ] MINIMIZE <X size={14} />
           </button>

           <div className="text-center mb-16 relative z-10">
               <Terminal size={40} className="mx-auto text-purple-600 mb-6 animate-pulse"/>
               <h2 className="text-gray-500 font-mono text-xs tracking-[0.5em] uppercase mb-2">System Initialization</h2>
               <h1 className="text-white font-cyber text-2xl tracking-widest">IT-VERSE 2025</h1>
           </div>

           <div className="flex gap-4 md:gap-16 text-center relative z-10">
              {[
                  { v: timeLeft.d, l: 'DAYS' }, 
                  { v: timeLeft.h, l: 'HOURS' }, 
                  { v: timeLeft.m, l: 'MINS' }, 
                  { v: timeLeft.s, l: 'SECS' }
              ].map((t, i) => (
                  <div key={i} className="flex flex-col items-center">
                      <div className="relative group cursor-default">
                          <span className="text-6xl md:text-9xl font-black font-cyber text-white tracking-tighter relative z-10">
                             {String(t.v).padStart(2, '0')}
                          </span>
                      </div>
                      <div className="w-12 h-1 bg-purple-900/50 my-6"></div>
                      <span className="text-xs text-gray-500 font-bold tracking-[0.3em] font-mono">{t.l}</span>
                  </div>
              ))}
           </div>
           
           <div className="absolute bottom-12 text-[10px] text-gray-700 font-mono">
               SECURE CONNECTION ESTABLISHED // ID: 8492-AX
           </div>
        </div>
      )}

    </div>
  );
};

export default Hero;
import React, { useState } from 'react';
import { Scan, Keyboard } from 'lucide-react';
import { Team } from '../types';

interface QRScannerProps {
  currentTeam: Team;
}

const QRScanner: React.FC<QRScannerProps> = ({ currentTeam }) => {
  const [manualCode, setManualCode] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    alert(`CODE SUBMITTED: ${manualCode}\nAnalyzing points for ${currentTeam.name}...`);
    setManualCode('');
  };

  return (
    <div className="w-full h-full flex flex-col relative bg-black overflow-hidden" style={{ minHeight: 'calc(100vh - 80px)' }}>
      {/* Feed Background */}
      <div className="absolute inset-0 opacity-30">
        <img 
            src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80" 
            className="w-full h-full object-cover filter grayscale contrast-125"
            alt="Camera Feed"
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.2)_1px,transparent_1px)] bg-[length:100%_4px]"></div>
      </div>

      {/* Scanner Overlay */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        
        {/* Reticle */}
        <div className="relative w-64 h-64 border-2 border-white/20 rounded-lg">
            {/* Corners */}
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4" style={{ borderColor: currentTeam.color }}></div>
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4" style={{ borderColor: currentTeam.color }}></div>
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4" style={{ borderColor: currentTeam.color }}></div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4" style={{ borderColor: currentTeam.color }}></div>
            
            {/* Scan Line */}
            <div 
                className="absolute left-0 w-full h-1 bg-white/50 shadow-[0_0_15px_currentColor] animate-[scan-line_2s_infinite_linear]"
                style={{ color: currentTeam.color }}
            ></div>

            {/* Center Status */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-mono tracking-widest text-white/70 animate-pulse whitespace-nowrap">
                SEARCHING...
            </div>
        </div>

        {/* Hints */}
        <div className="mt-8 bg-black/80 backdrop-blur border border-white/10 px-6 py-3 rounded-full flex items-center gap-3">
            <Scan className="animate-pulse" size={18} style={{ color: currentTeam.color }} />
            <span className="text-xs font-bold tracking-wider text-white">POINT AT QR CODE</span>
        </div>

      </div>

      {/* Bottom Panel */}
      <div className="relative z-20 bg-[#0f0f1a]/90 border-t border-gray-800 p-6 md:p-8">
        <div className="max-w-md mx-auto w-full">
            
            {/* Recent Scans */}
            <div className="mb-6 p-4 bg-black/40 rounded border border-white/5">
                <h4 className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-widest">Recent Activity</h4>
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-400 font-mono">CODE: #A92-B</span>
                        <span className="text-green-400 font-bold">+50 PTS</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-400 font-mono">CODE: #X11-0</span>
                        <span className="text-green-400 font-bold">+20 PTS</span>
                    </div>
                </div>
            </div>

            {/* Manual Entry */}
            <form onSubmit={handleManualSubmit} className="flex gap-2">
                <div className="relative flex-1">
                    <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                        type="text" 
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="ENTER MANUAL CODE" 
                        className="w-full bg-black border border-gray-700 focus:border-[var(--team-color)] text-white text-xs py-3 pl-10 pr-4 rounded outline-none font-mono transition-colors"
                        style={{ '--team-color': currentTeam.color } as React.CSSProperties}
                    />
                </div>
                <button 
                    type="submit"
                    className="px-6 py-2 bg-white text-black font-bold text-xs rounded hover:bg-gray-200 transition-colors"
                >
                    SUBMIT
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;

import React, { useEffect, useRef } from 'react';
import { GameEvent, Match, Team } from '../types';
import { X, Trophy, Users, Clock, Monitor, PlayCircle } from 'lucide-react';

interface EventModalProps {
  event: GameEvent | null;
  onClose: () => void;
  teams: Record<string, Team>;
}

const EventModal: React.FC<EventModalProps> = ({ event, onClose, teams }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (event) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; }
  }, [event]);

  if (!event) return null;

  const activeMatch = event.matches.find(m => m.status === 'live') || event.matches[0];

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* CLOSE BUTTON - High Visibility */}
        <button 
            onClick={onClose}
            className="fixed top-6 right-6 z-[210] group flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-full font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all hover:scale-105 active:scale-95"
            aria-label="Close"
        >
            <span className="text-xs hidden md:inline">Close Panel</span>
            <X size={20} />
        </button>

        {/* SCROLLABLE CONTENT AREA */}
        <div ref={modalRef} className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar bg-black">
            
            {/* CINEMATIC HEADER */}
            <div className="relative w-full h-[50vh] min-h-[400px] shrink-0">
                <div className="absolute inset-0">
                    <img src={event.image} className="w-full h-full object-cover" alt="Banner" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
                </div>

                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 max-w-7xl mx-auto flex flex-col justify-end h-full pointer-events-none">
                    <div className="flex flex-wrap items-center gap-3 mb-4 animate-in slide-in-from-bottom-4 duration-500 delay-100">
                        <span className="px-3 py-1 rounded bg-white/10 backdrop-blur border border-white/10 text-xs font-bold uppercase tracking-widest text-white">
                            {event.shortName} Series
                        </span>
                        {activeMatch?.status === 'live' && (
                            <span className="px-3 py-1 rounded bg-red-600 text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2 animate-pulse shadow-[0_0_15px_red]">
                                <span className="w-2 h-2 bg-white rounded-full"></span> Live Broadcast
                            </span>
                        )}
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black font-cyber text-white leading-none tracking-tighter mb-4 drop-shadow-2xl animate-in slide-in-from-bottom-4 duration-500 delay-200">
                        {event.title}
                    </h1>
                    
                    <p className="text-gray-300 font-ui text-lg md:text-xl max-w-2xl leading-relaxed drop-shadow-lg animate-in slide-in-from-bottom-4 duration-500 delay-300">
                        {event.description}
                    </p>
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="max-w-[1800px] mx-auto p-6 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 animate-in slide-in-from-bottom-8 duration-700 delay-300 bg-black">
                
                {/* LEFT COL: STREAM & MATCH INFO (8/12) */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* VIDEO PLAYER CONTAINER */}
                    <div className="relative w-full aspect-video bg-[#0a0a0a] rounded-xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)] group ring-1 ring-white/5">
                        {activeMatch?.streamUrl ? (
                            <iframe 
                                src={activeMatch.streamUrl} 
                                title="Live Stream" 
                                className="w-full h-full" 
                                allowFullScreen 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 space-y-4">
                                <Monitor size={48} className="opacity-50" />
                                <div className="font-mono text-sm tracking-widest uppercase">Stream Offline</div>
                            </div>
                        )}
                    </div>

                    {/* MATCH SCOREBOARD */}
                    {activeMatch && (
                        <div className="bg-[#111] border border-white/10 rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></div>
                            
                            {/* Team A */}
                            <div className="flex-1 flex items-center justify-end gap-6 text-right">
                                <div>
                                    <div className="text-2xl font-black font-cyber text-white tracking-wide">{teams[activeMatch.teamA]?.name}</div>
                                    <div className="text-xs font-mono text-gray-500 uppercase tracking-widest">Challenger</div>
                                </div>
                                <div className="text-5xl md:text-6xl">{teams[activeMatch.teamA]?.logo}</div>
                            </div>

                            {/* VS / Score */}
                            <div className="flex flex-col items-center px-8 relative z-10">
                                <div className="text-4xl md:text-6xl font-black font-pixel text-white tracking-widest flex items-center gap-4">
                                    <span className={activeMatch.scoreA > activeMatch.scoreB ? 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'text-gray-400'}>{activeMatch.scoreA}</span>
                                    <span className="text-gray-700 text-2xl">:</span>
                                    <span className={activeMatch.scoreB > activeMatch.scoreA ? 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'text-gray-400'}>{activeMatch.scoreB}</span>
                                </div>
                                <div className="mt-2 px-3 py-1 rounded bg-red-900/30 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={12} /> {activeMatch.status === 'live' ? 'In Progress' : 'Final'}
                                </div>
                            </div>

                            {/* Team B */}
                            <div className="flex-1 flex items-center justify-start gap-6 text-left">
                                <div className="text-5xl md:text-6xl">{teams[activeMatch.teamB]?.logo}</div>
                                <div>
                                    <div className="text-2xl font-black font-cyber text-white tracking-wide">{teams[activeMatch.teamB]?.name}</div>
                                    <div className="text-xs font-mono text-gray-500 uppercase tracking-widest">Defender</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COL: SIDEBAR (4/12) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Sidebar content (Bracket Summary & Rosters) */}
                    <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                        <h3 className="font-cyber text-xl text-white mb-6 flex items-center gap-3">
                            <Trophy size={20} className="text-yellow-500"/> TOURNAMENT BRACKET
                        </h3>
                        <div className="space-y-3">
                            {event.matches.map(m => (
                                <div key={m.id} className={`group p-4 rounded-lg border transition-all ${m.status === 'live' ? 'border-purple-500/50 bg-purple-900/10' : 'border-white/5 bg-black/20 hover:bg-white/5'}`}>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">ROUND {m.round + 1}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${m.status === 'live' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                                            {m.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className={`text-sm font-bold ${m.winnerId === m.teamA ? 'text-green-400' : 'text-gray-300'}`}>{teams[m.teamA]?.name}</span>
                                            <span className="font-mono text-white bg-black/40 px-2 rounded">{m.scoreA}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className={`text-sm font-bold ${m.winnerId === m.teamB ? 'text-green-400' : 'text-gray-300'}`}>{teams[m.teamB]?.name}</span>
                                            <span className="font-mono text-white bg-black/40 px-2 rounded">{m.scoreB}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                        <h3 className="font-cyber text-xl text-white mb-6 flex items-center gap-3">
                            <Users size={20} className="text-blue-500"/> TEAM ROSTERS
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                             <div className="text-sm text-gray-500 italic">Participating teams: {(Object.values(teams) as Team[]).slice(0, 4).map(t => t.name).join(', ')}...</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};

export default EventModal;

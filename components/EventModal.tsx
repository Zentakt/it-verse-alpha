import React, { useEffect, useRef } from 'react';
import { GameEvent, Match, Team } from '../types';
import { X, Trophy, Users, Clock } from 'lucide-react';
import gsap from 'gsap';

interface EventModalProps {
  event: GameEvent | null;
  onClose: () => void;
  teams: Record<string, Team>;
}

const EventModal: React.FC<EventModalProps> = ({ event, onClose, teams }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (event && modalRef.current) {
      document.body.style.overflow = 'hidden';
      gsap.fromTo(modalRef.current, 
        { opacity: 0, scale: 0.95 }, 
        { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
      );
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [event]);

  if (!event) return null;

  const activeMatch = event.matches.find(m => m.status === 'live') || event.matches[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        ref={modalRef} 
        className="w-full max-w-6xl max-h-[90vh] bg-[#0f0f1a] border border-purple-500/30 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(124,58,237,0.3)] flex flex-col"
      >
        {/* Header */}
        <div className="relative h-48 md:h-64 shrink-0">
          <img src={event.image} className="w-full h-full object-cover" alt="Banner" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] to-transparent" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-white hover:text-black transition-colors"
          >
            <X size={24} />
          </button>
          <div className="absolute bottom-6 left-8">
            <h2 className="text-4xl font-cyber font-bold text-white mb-2 glitch-effect" data-text={event.title}>{event.title}</h2>
            <p className="text-purple-300 font-ui text-lg">{event.description}</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Stream Area */}
            <div className="lg:col-span-2 space-y-6">
              {activeMatch?.streamUrl ? (
                <div className="aspect-video w-full bg-black rounded-lg overflow-hidden border border-purple-900 shadow-lg">
                  <iframe 
                    src={activeMatch.streamUrl} 
                    title="Live Stream" 
                    className="w-full h-full" 
                    allowFullScreen 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              ) : (
                <div className="aspect-video w-full bg-gray-900 rounded-lg flex items-center justify-center text-gray-500 font-pixel">
                  OFFLINE / NO STREAM
                </div>
              )}
              
              {/* Match Info */}
              {activeMatch && (
                <div className="bg-purple-900/10 p-6 rounded-lg border border-purple-500/20">
                  <div className="flex justify-between items-center mb-4">
                     <span className="text-neon-pink font-bold font-cyber flex items-center gap-2">
                       <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> LIVE
                     </span>
                     <span className="text-gray-400 font-ui flex items-center gap-1">
                        <Clock size={16}/> {new Date(activeMatch.startTime).toLocaleTimeString()}
                     </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-center w-1/3">
                      <div className="text-4xl mb-2">{teams[activeMatch.teamA]?.logo}</div>
                      <div className="font-bold font-ui text-xl">{teams[activeMatch.teamA]?.name}</div>
                    </div>
                    <div className="text-center w-1/3 font-pixel text-3xl text-purple-400">
                      {activeMatch.scoreA} - {activeMatch.scoreB}
                    </div>
                    <div className="text-center w-1/3">
                      <div className="text-4xl mb-2">{teams[activeMatch.teamB]?.logo}</div>
                      <div className="font-bold font-ui text-xl">{teams[activeMatch.teamB]?.name}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar: Bracket & Standings */}
            <div className="space-y-6">
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                <h3 className="font-cyber text-xl mb-4 flex items-center gap-2"><Trophy size={20} className="text-yellow-500"/> Bracket</h3>
                <div className="space-y-4">
                  {event.matches.map(m => (
                    <div key={m.id} className={`p-3 rounded border ${m.status === 'live' ? 'border-purple-500 bg-purple-900/20' : 'border-gray-700 bg-gray-800/50'}`}>
                      <div className="flex justify-between text-sm mb-2 text-gray-400">
                        <span>Round {m.round}</span>
                        <span className="uppercase text-xs">{m.status}</span>
                      </div>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`${m.winnerId === m.teamA ? 'text-green-400' : 'text-white'}`}>{teams[m.teamA]?.name}</span>
                        <span className="font-mono">{m.scoreA}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`${m.winnerId === m.teamB ? 'text-green-400' : 'text-white'}`}>{teams[m.teamB]?.name}</span>
                        <span className="font-mono">{m.scoreB}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                <h3 className="font-cyber text-xl mb-4 flex items-center gap-2"><Users size={20} className="text-blue-500"/> Rosters</h3>
                <div className="text-sm text-gray-400 font-ui">
                  Participating teams: {(Object.values(teams) as Team[]).slice(0, 4).map(t => t.name).join(', ')}...
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
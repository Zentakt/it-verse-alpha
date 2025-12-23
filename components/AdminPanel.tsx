import React, { useState } from 'react';
import { AppState, GameEvent, Match } from '../types';
import { Settings, PlayCircle, Clock } from 'lucide-react';

interface AdminPanelProps {
  appState: AppState;
  events: GameEvent[];
  updateCountdown: (date: string) => void;
  updateMatchStatus: (eventId: string, matchId: string, status: Match['status']) => void;
  toggleConfetti: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ appState, events, updateCountdown, updateMatchStatus, toggleConfetti }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dateInput, setDateInput] = useState(appState.countdownEnd.slice(0, 16));

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-gray-900 border border-purple-500 text-purple-500 p-3 rounded-full hover:bg-purple-900 hover:text-white transition-all shadow-lg"
      >
        <Settings size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 bg-[#0f0f1a] border border-purple-500 rounded-lg shadow-2xl overflow-hidden font-ui">
      <div className="bg-purple-900/50 p-3 flex justify-between items-center border-b border-purple-500/30">
        <h3 className="font-bold text-white">Admin Console</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">&times;</button>
      </div>
      
      <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
        {/* Countdown Control */}
        <div>
          <label className="block text-xs text-gray-400 mb-1 uppercase">Countdown Target</label>
          <div className="flex gap-2">
            <input 
              type="datetime-local" 
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-full bg-black border border-gray-700 text-white text-sm p-1 rounded"
            />
            <button 
              onClick={() => updateCountdown(new Date(dateInput).toISOString())}
              className="bg-purple-600 text-white text-xs px-2 rounded hover:bg-purple-500"
            >
              SET
            </button>
          </div>
        </div>

        {/* Confetti Trigger */}
        <div>
           <button 
             onClick={toggleConfetti}
             className="w-full bg-neon-pink/20 text-neon-pink border border-neon-pink/50 py-2 rounded text-sm hover:bg-neon-pink hover:text-white transition-colors"
           >
             TRIGGER CONFETTI
           </button>
        </div>

        {/* Simple Match Manager */}
        <div>
          <label className="block text-xs text-gray-400 mb-2 uppercase">Live Match Controls</label>
          {events.flatMap(e => e.matches).map(m => (
            <div key={m.id} className="mb-2 p-2 bg-black/40 rounded border border-gray-800 text-xs">
              <div className="flex justify-between mb-1 text-gray-300">
                <span>{m.id}</span>
                <span className={m.status === 'live' ? 'text-red-500' : ''}>{m.status}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => updateMatchStatus(events.find(e => e.matches.includes(m))!.id, m.id, 'scheduled')} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600">Wait</button>
                <button onClick={() => updateMatchStatus(events.find(e => e.matches.includes(m))!.id, m.id, 'live')} className="px-2 py-1 bg-red-900 text-red-100 rounded hover:bg-red-700">Live</button>
                <button onClick={() => updateMatchStatus(events.find(e => e.matches.includes(m))!.id, m.id, 'completed')} className="px-2 py-1 bg-green-900 text-green-100 rounded hover:bg-green-700">End</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

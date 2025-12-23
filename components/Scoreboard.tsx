import React, { useState } from 'react';
import { Team } from '../types';
import { ChevronDown, ChevronUp, Medal } from 'lucide-react';

interface ScoreboardProps {
  teams: Record<string, Team>;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ teams }) => {
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const sortedTeams = (Object.values(teams) as Team[]).sort((a, b) => {
    // Mock total points calculation based on seed/breakdown for demo
    const pointsA = 1000 - (a.seed * 50) + a.breakdown.reduce((acc, curr) => acc + curr.points, 0);
    const pointsB = 1000 - (b.seed * 50) + b.breakdown.reduce((acc, curr) => acc + curr.points, 0);
    return pointsB - pointsA;
  });

  const toggleExpand = (id: string) => {
    setExpandedTeam(expandedTeam === id ? null : id);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-8 pb-24">
      <div className="flex items-center gap-3 mb-8 border-b border-gray-800 pb-4">
        <Medal className="text-yellow-500" />
        <h2 className="text-xl font-bold font-cyber tracking-wide">FACTION STANDINGS</h2>
      </div>
      
      <div className="flex flex-col gap-4">
        {sortedTeams.map((team, idx) => {
           const isExpanded = expandedTeam === team.id;
           const totalPoints = 1000 - (team.seed * 50) + team.breakdown.reduce((acc, curr) => acc + curr.points, 0);

           return (
              <div 
                key={team.id} 
                className={`bg-[#111827] border-2 transition-all duration-300 rounded-lg overflow-hidden ${isExpanded ? 'border-gray-600 bg-[#161e2e]' : 'border-gray-800 hover:border-gray-700'}`}
              >
                <button 
                    onClick={() => toggleExpand(team.id)}
                    className="w-full p-4 md:p-6 flex items-center justify-between group"
                >
                    <div className="flex items-center gap-4 md:gap-6">
                        <span className="font-mono text-2xl font-bold text-gray-600 w-8">#{idx + 1}</span>
                        <div className="w-12 h-12 flex items-center justify-center text-3xl bg-black/30 rounded-lg border border-white/5">
                            {team.logo}
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-white text-lg group-hover:text-[var(--team-color)] transition-colors" style={{ '--team-color': team.color } as React.CSSProperties}>
                                {team.name}
                            </h3>
                            <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">{team.description}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="text-right hidden md:block">
                            <div className="font-bold text-2xl text-white">{totalPoints}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Total Points</div>
                        </div>
                        <div className="text-gray-500">
                            {isExpanded ? <ChevronUp /> : <ChevronDown />}
                        </div>
                    </div>
                </button>

                {/* Breakdown */}
                {isExpanded && (
                    <div className="border-t border-gray-700/50 bg-black/20 p-4 md:p-6 animate-in slide-in-from-top-2 duration-200">
                        <h4 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Points Breakdown</h4>
                        <div className="grid gap-2">
                            {team.breakdown.length > 0 ? (
                                team.breakdown.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-black/40 rounded border border-white/5 text-sm">
                                        <span className="text-gray-300">{item.source}</span>
                                        <span className="font-mono font-bold text-green-400">+{item.points}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-600 text-xs italic p-2">No recent point activity recorded.</div>
                            )}
                            {/* Base Points Entry */}
                            <div className="flex justify-between items-center p-3 bg-black/40 rounded border border-white/5 text-sm opacity-60">
                                <span className="text-gray-400">Base Seed Points</span>
                                <span className="font-mono font-bold text-gray-400">+{1000 - (team.seed * 50)}</span>
                            </div>
                        </div>
                    </div>
                )}
              </div>
           );
        })}
      </div>
    </div>
  );
};

export default Scoreboard;

import React, { useState } from 'react';
import { X, Copy, Mail, Send, Trophy, MessageSquare, Users, Share2, ExternalLink, Hash, ChevronRight, ArrowRight, Circle } from 'lucide-react';
import { Team } from '../types';

interface BracketOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    gameName: string;
    currentTeam: Team;
}

// --- MOCK DATA ---
const PARTICIPANTS = [
    { rank: 1, name: 'MontanaBlack88', status: 'active', avatar: 'https://picsum.photos/50/50?r=1' },
    { rank: 2, name: 'SypherPK', status: 'eliminated', avatar: 'https://picsum.photos/50/50?r=2' },
    { rank: 3, name: 'unicornioperro', status: 'eliminated', avatar: 'https://picsum.photos/50/50?r=3' },
    { rank: 4, name: 'benjyfishy', status: 'active', avatar: 'https://picsum.photos/50/50?r=4' },
    { rank: 5, name: 'DvLZStaTioN', status: 'active', avatar: 'https://picsum.photos/50/50?r=5' },
    { rank: 6, name: 'Payamz', status: 'eliminated', avatar: 'https://picsum.photos/50/50?r=6' },
    { rank: 7, name: 'ChicaLive', status: 'eliminated', avatar: 'https://picsum.photos/50/50?r=7' },
    { rank: 8, name: 'StarbeastGG', status: 'eliminated', avatar: 'https://picsum.photos/50/50?r=8' },
];

const BRACKET_ROUNDS = [
    {
        name: "Round One",
        matches: [
            { id: 1, p1: "MontanaBlack88", p2: "SypherPK", s1: 6, s2: 3, winner: "p1" },
            { id: 2, p1: "unicornioperro", p2: "benjyfishy", s1: 4, s2: 5, winner: "p2" },
            { id: 3, p1: "DvLZStaTioN", p2: "Payamz", s1: 4, s2: 3, winner: "p1" },
            { id: 4, p1: "ChicaLive", p2: "StarbeastGG", s1: 6, s2: 3, winner: "p1" },
        ]
    },
    {
        name: "Round Two",
        matches: [
            { id: 5, p1: "MontanaBlack88", p2: "benjyfishy", s1: 6, s2: 2, winner: "p1" },
            { id: 6, p1: "DvLZStaTioN", p2: "ChicaLive", s1: 4, s2: 5, winner: "p2" },
        ]
    },
    {
        name: "Final Round",
        matches: [
            { id: 7, p1: "MontanaBlack88", p2: "ChicaLive", s1: 6, s2: 3, winner: "p1" },
        ]
    }
];

const CHAT_MESSAGES = [
    { user: 'Ryan', msg: "I'll kick your Ass! lol", color: '#60a5fa' },
    { user: 'Jane', msg: "Lorem ipsum", color: '#f472b6' },
    { user: 'Ronny', msg: "Lorem ipsum", color: '#4ade80' },
];

const BracketOverlay: React.FC<BracketOverlayProps> = ({ isOpen, onClose, gameName, currentTeam }) => {
    // Mobile View State: 'bracket', 'participants', 'info'
    const [mobileView, setMobileView] = useState<'bracket' | 'participants' | 'info'>('bracket');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-[#05050a] flex flex-col overflow-hidden animate-in fade-in duration-300">
            {/* --- HEADER --- */}
            <div className="h-16 md:h-20 border-b border-white/10 bg-[#0b0b14]/90 backdrop-blur flex items-center justify-between px-4 md:px-8 shrink-0 relative z-50">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-blue-600 flex items-center justify-center text-white font-bold">IT</div>
                    <div className="h-8 w-[1px] bg-white/20 mx-2 hidden md:block"></div>
                    <div>
                        <div className="text-[10px] text-blue-400 font-bold tracking-widest uppercase mb-0.5">{gameName}</div>
                        <h1 className="text-lg md:text-2xl font-black text-white leading-none tracking-wide">Ultimate Challenge</h1>
                    </div>
                </div>
                
                {/* Desktop Actions */}
                <div className="flex items-center gap-4">
                    <button className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-500/10 transition-colors">
                        Connect Accounts
                    </button>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* --- MAIN CONTENT GRID --- */}
            <div className="flex-1 overflow-hidden relative">
                {/* Background Glow */}
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="w-full h-full max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-[300px_1fr_350px] gap-6 p-4 md:p-8 relative z-10">
                    
                    {/* --- LEFT SIDEBAR: PARTICIPANTS (Hidden on Mobile unless selected) --- */}
                    <div className={`
                        flex-col gap-6 lg:flex
                        ${mobileView === 'participants' ? 'flex absolute inset-4 z-20 bg-[#05050a] pb-20' : 'hidden'}
                    `}>
                        {/* Participants List */}
                        <div className="flex-1 bg-[#0f1016] border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                            <div className="p-5 border-b border-white/5 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-300">Participants</h3>
                                <ExternalLink size={14} className="text-gray-500" />
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                {PARTICIPANTS.map((p) => (
                                    <div key={p.rank} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${p.status === 'eliminated' ? 'opacity-50 hover:bg-white/5' : 'bg-blue-900/20 border border-blue-500/30'}`}>
                                        <span className="text-xs font-mono text-gray-500 w-4">{p.rank}.</span>
                                        <img src={p.avatar} className="w-6 h-6 rounded-full bg-gray-800" alt="" />
                                        <span className="text-sm font-bold text-gray-200 truncate flex-1">{p.name}</span>
                                        {p.status === 'active' && <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_5px_#22c55e]"></div>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Share Card */}
                        <div className="bg-[#0f1016] border border-white/5 rounded-2xl p-5 shadow-2xl">
                            <h3 className="text-sm font-bold text-gray-300 mb-4">Share</h3>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <button className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 py-3 rounded-lg text-xs font-bold text-gray-300 transition-colors">
                                    <Copy size={14} /> Copy Link
                                </button>
                                <button className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 py-3 rounded-lg text-xs font-bold text-gray-300 transition-colors">
                                    <Mail size={14} /> Send Email
                                </button>
                            </div>
                            <div className="bg-black/40 rounded-lg p-3 flex items-center justify-between border border-white/5">
                                <span className="text-xs text-blue-400 truncate max-w-[150px]">itverse.com/t/fn-25</span>
                                <button className="bg-blue-600 p-1.5 rounded text-white hover:bg-blue-500"><Copy size={12}/></button>
                            </div>
                        </div>
                    </div>

                    {/* --- CENTER: BRACKET (Always visible on Desktop, toggled on Mobile) --- */}
                    <div className={`
                        flex-col lg:flex overflow-hidden relative
                        ${mobileView === 'bracket' ? 'flex absolute inset-0 z-10 pt-20 pb-24 md:pt-0 md:pb-0 md:relative' : 'hidden'}
                    `}>
                        {/* Mobile Header for Bracket (Inside view) */}
                        <div className="lg:hidden absolute top-4 left-4 right-4 flex justify-between items-center text-white/50">
                            <div className="text-xs font-bold">SWIPE OR SCROLL </div>
                            <ChevronRight size={16} />
                        </div>

                        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar flex items-center px-4 md:px-0">
                            <div className="flex gap-12 md:gap-24 min-w-max mx-auto py-8 pl-4 md:pl-0">
                                {BRACKET_ROUNDS.map((round, rIdx) => (
                                    <div key={rIdx} className="flex flex-col justify-around gap-8 md:gap-12 w-64 md:w-80">
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center mb-4">{round.name}</div>
                                        <div className="flex flex-col justify-center gap-8 md:gap-16 flex-1">
                                            {round.matches.map((match) => (
                                                <div key={match.id} className="bg-[#0f1016] border border-white/10 rounded-xl overflow-visible shadow-lg relative group">
                                                    
                                                    {/* --- CONNECTION ARROW TO NEXT ROUND --- */}
                                                    {rIdx < BRACKET_ROUNDS.length - 1 && (
                                                        <div className="absolute top-1/2 -right-[1.5rem] md:-right-[3rem] w-[1.5rem] md:w-[3rem] h-[1px] bg-gradient-to-r from-blue-500/30 to-blue-500 z-0 hidden lg:flex items-center">
                                                            {/* Arrow Circle Node */}
                                                            <div className="absolute right-0 translate-x-1/2 w-5 h-5 rounded-full bg-[#05050a] border border-blue-500/50 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.3)] z-10">
                                                                <ChevronRight size={10} className="text-blue-400" />
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Player 1 Row */}
                                                    <div className={`flex justify-between items-center p-3 md:p-4 border-b border-white/5 relative overflow-hidden ${match.winner === 'p1' ? 'bg-blue-500/10' : ''}`}>
                                                        <span className={`text-xs md:text-sm font-bold truncate pr-4 ${match.winner === 'p1' ? 'text-white' : 'text-gray-500'}`}>{match.p1}</span>
                                                        <div className="flex items-center gap-3">
                                                            {match.winner === 'p1' && <ArrowRight size={14} className="text-blue-500 animate-pulse hidden md:block" />}
                                                            <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${match.winner === 'p1' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-500'}`}>
                                                                {match.s1}
                                                            </div>
                                                        </div>
                                                        {match.winner === 'p1' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                                                    </div>

                                                    {/* Player 2 Row */}
                                                    <div className={`flex justify-between items-center p-3 md:p-4 relative overflow-hidden ${match.winner === 'p2' ? 'bg-blue-500/10' : ''}`}>
                                                        <span className={`text-xs md:text-sm font-bold truncate pr-4 ${match.winner === 'p2' ? 'text-white' : 'text-gray-500'}`}>{match.p2}</span>
                                                        <div className="flex items-center gap-3">
                                                            {match.winner === 'p2' && <ArrowRight size={14} className="text-blue-500 animate-pulse hidden md:block" />}
                                                            <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${match.winner === 'p2' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-500'}`}>
                                                                {match.s2}
                                                            </div>
                                                        </div>
                                                        {match.winner === 'p2' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                                                    </div>
                                                    
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT SIDEBAR: CHAT & INFO (Hidden on Mobile unless selected) --- */}
                    <div className={`
                        flex-col gap-6 lg:flex
                        ${mobileView === 'info' ? 'flex absolute inset-4 z-20 bg-[#05050a] pb-20' : 'hidden'}
                    `}>
                        {/* Discussion */}
                        <div className="flex-1 bg-[#0f1016] border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                            <div className="p-5 border-b border-white/5 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-300">Discussion</h3>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                {CHAT_MESSAGES.map((msg, i) => (
                                    <div key={i} className="text-sm">
                                        <span className="font-bold mr-2" style={{ color: msg.color }}>{msg.user}:</span>
                                        <span className="text-gray-400">{msg.msg}</span>
                                    </div>
                                ))}
                                <div className="text-center py-4">
                                    <span className="text-[10px] text-gray-600 uppercase tracking-widest">Today 10:23 PM</span>
                                </div>
                            </div>
                            <div className="p-4 border-t border-white/5">
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Send a message..." 
                                        className="w-full bg-black/50 border border-white/10 rounded-lg py-3 px-4 text-sm text-white focus:border-blue-500 outline-none pr-10"
                                    />
                                    <button className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 p-1.5 hover:bg-blue-500/10 rounded">
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Leaderboard Summary */}
                        <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-50"><Trophy size={48} className="text-white/10" /></div>
                            <div className="relative z-10">
                                <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">Fortnite Leaderboard</div>
                                <h3 className="text-xl font-bold text-white mb-6">Ultimate Challenge</h3>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] text-gray-400 uppercase">Top Player</div>
                                            <div className="text-sm font-bold text-white">1. MontanaBlack88</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-gray-400 uppercase">Score</div>
                                            <div className="text-sm font-bold text-green-400">9820</div>
                                        </div>
                                    </div>
                                    <div className="h-[1px] bg-white/10 w-full"></div>
                                    <div className="flex items-center justify-between opacity-75">
                                        <div className="text-xs font-bold text-gray-300">2. ChicaLive</div>
                                        <div className="text-xs font-bold text-gray-500">8450</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* --- MOBILE NAVIGATION BAR (Bottom Sticky) --- */}
            <div className="lg:hidden h-16 bg-[#0b0b14] border-t border-white/10 flex items-center justify-around px-4 relative z-50 shrink-0">
                <button 
                    onClick={() => setMobileView('participants')}
                    className={`flex flex-col items-center gap-1 ${mobileView === 'participants' ? 'text-blue-400' : 'text-gray-500'}`}
                >
                    <Users size={20} />
                    <span className="text-[10px] font-bold uppercase">People</span>
                </button>
                <button 
                    onClick={() => setMobileView('bracket')}
                    className={`flex flex-col items-center gap-1 ${mobileView === 'bracket' ? 'text-blue-400' : 'text-gray-500'}`}
                >
                    <Hash size={20} />
                    <span className="text-[10px] font-bold uppercase">Bracket</span>
                </button>
                <button 
                    onClick={() => setMobileView('info')}
                    className={`flex flex-col items-center gap-1 ${mobileView === 'info' ? 'text-blue-400' : 'text-gray-500'}`}
                >
                    <MessageSquare size={20} />
                    <span className="text-[10px] font-bold uppercase">Chat</span>
                </button>
            </div>
        </div>
    );
};

export default BracketOverlay;

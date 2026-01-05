
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Trophy, ExternalLink, Share2 } from 'lucide-react';
import { Team } from '../types';
import { TEAMS } from '../constants';

interface BracketMatch {
    id: string;
    round: number; 
    p1: { id: string; score: number | null; isWinner?: boolean };
    p2: { id: string; score: number | null; isWinner?: boolean };
    nextMatchId?: string;
    status: 'scheduled' | 'live' | 'finished';
}

interface BracketOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    gameName: string;
    currentTeam: Team;
    bracketData?: BracketMatch[]; // Now accepts data via props
}

const BracketOverlay: React.FC<BracketOverlayProps> = ({ isOpen, onClose, gameName, bracketData }) => {
    const [hoveredTeamId, setHoveredTeamId] = useState<string | null>(null);
    
    // Canvas Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Fallback if no data provided (Safety)
    const matches = bracketData || [];

    // --- CANVAS DRAWING LOGIC ---
    const drawConnections = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        const content = contentRef.current;
        if (!canvas || !container || !content) return;

        // Resize canvas to match the scrollable content size
        const width = Math.max(container.clientWidth, content.scrollWidth + 100); 
        const height = Math.max(container.clientHeight, content.scrollHeight + 100);
        
        // Handle high DPI displays
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        const isMobile = window.innerWidth < 768;

        // CONFIG
        const LINE_WIDTH = isMobile ? 2 : 3;
        const COLOR_DEFAULT = '#334155'; // Slate 700
        
        // Draw Lines
        matches.forEach(match => {
            if (!match.nextMatchId) return;

            const startEl = document.getElementById(`match-${match.id}`);
            const endEl = document.getElementById(`match-${match.nextMatchId}`);

            if (startEl && endEl) {
                const startRect = startEl.getBoundingClientRect();
                const endRect = endEl.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();

                // Calculate relative positions to the scrolling content
                const scrollLeft = container.scrollLeft;
                const scrollTop = container.scrollTop;

                const x1 = (startRect.right - containerRect.left) + scrollLeft;
                const y1 = (startRect.top - containerRect.top) + scrollTop + (startRect.height / 2);
                
                const x2 = (endRect.left - containerRect.left) + scrollLeft;
                const y2 = (endRect.top - containerRect.top) + scrollTop + (endRect.height / 2);

                // Bezier Control Points
                const cp1x = x1 + (x2 - x1) * 0.5;
                const cp1y = y1;
                const cp2x = x1 + (x2 - x1) * 0.5;
                const cp2y = y2;

                // Determine if this path is active (hovered)
                const isPathActive = 
                    hoveredTeamId && (
                        match.p1.id === hoveredTeamId || 
                        match.p2.id === hoveredTeamId
                    );
                
                // Dynamic Color based on hovered team
                const activeColor = hoveredTeamId && TEAMS[hoveredTeamId] 
                    ? TEAMS[hoveredTeamId].color 
                    : '#3b82f6'; // Fallback blue

                // Draw Shadow/Glow first
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
                
                ctx.lineWidth = isPathActive ? (isMobile ? 4 : 6) : LINE_WIDTH;
                ctx.strokeStyle = isPathActive ? `${activeColor}40` : 'transparent'; // Low opacity glow
                ctx.lineCap = 'round';
                ctx.stroke();

                // Draw Main Line
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
                
                ctx.lineWidth = LINE_WIDTH;
                ctx.strokeStyle = isPathActive ? activeColor : COLOR_DEFAULT;
                ctx.stroke();
                
                // Draw Junction Dot at start
                ctx.beginPath();
                ctx.arc(x1, y1, isMobile ? 3 : 4, 0, Math.PI * 2);
                ctx.fillStyle = isPathActive ? activeColor : COLOR_DEFAULT;
                ctx.fill();
            }
        });
    }, [hoveredTeamId, matches]);

    // Redraw on window resize or scroll
    useEffect(() => {
        window.addEventListener('resize', drawConnections);
        // Initial draw delay to ensure DOM is rendered
        const t = setTimeout(drawConnections, 100);
        return () => {
            window.removeEventListener('resize', drawConnections);
            clearTimeout(t);
        };
    }, [drawConnections]);

    if (!isOpen) return null;

    // --- SUB-COMPONENTS ---

    const TeamRow: React.FC<{ p: { id: string, score: number|null }, isWinner?: boolean, isBottom?: boolean }> = ({ p, isWinner, isBottom }) => {
        const team = TEAMS[p.id];
        // Fallback for TBD or unknown IDs
        const name = team ? team.name : (p.id === 'tbd' ? 'TBD' : p.id);
        const color = team ? team.color : '#64748b';
        const logo = team ? team.logo : '🛡️';

        return (
            <div 
                className={`
                    flex items-center justify-between px-3 py-3 md:px-5 md:py-4
                    ${isBottom ? '' : 'border-b border-white/5'}
                    relative overflow-hidden
                    transition-all duration-200
                    hover:bg-white/5 cursor-pointer group/row
                `}
                onMouseEnter={() => setHoveredTeamId(p.id)}
                onMouseLeave={() => setHoveredTeamId(null)}
            >
                {/* Winner / Active Glow Background */}
                {isWinner && (
                    <div className="absolute inset-0 opacity-10 transition-opacity duration-300" style={{ backgroundColor: color }}></div>
                )}
                
                {/* Left Accent Bar */}
                <div 
                    className={`absolute left-0 top-0 bottom-0 w-1 md:w-1.5 transition-all duration-300 ${isWinner ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-50'}`} 
                    style={{ backgroundColor: color, boxShadow: `0 0 15px ${color}` }}
                ></div>

                {/* Content */}
                <div className="flex items-center gap-2 md:gap-4 overflow-hidden relative z-10">
                    <div className={`w-6 md:w-8 h-6 md:h-8 text-center shrink-0 transition-all duration-300 flex items-center justify-center ${isWinner ? 'grayscale-0 scale-110' : 'grayscale group-hover/row:grayscale-0'}`}>
                        {typeof logo === 'string' && logo.startsWith('data:') ? (
                            <img src={logo} alt={name} className="w-full h-full object-cover rounded" />
                        ) : (
                            <span className="text-lg md:text-2xl leading-none">{logo}</span>
                        )}
                    </div>
                    
                    <div className={`
                        text-xs md:text-lg font-bold truncate transition-colors duration-300
                        ${isWinner ? 'text-white' : 'text-gray-500 group-hover/row:text-gray-200'}
                        ${hoveredTeamId === p.id ? '!text-white' : ''}
                    `}
                    style={isWinner || hoveredTeamId === p.id ? { textShadow: `0 0 20px ${color}66` } : {}}
                    >
                        {name}
                    </div>
                </div>

                {/* Score */}
                {p.score !== null && (
                    <div className={`
                        w-6 h-6 md:w-10 md:h-10 rounded flex items-center justify-center text-xs md:text-lg font-black font-mono relative z-10 transition-all duration-300
                        ${isWinner ? 'text-white shadow-lg scale-110' : 'bg-[#0a0a10] text-gray-600'}
                    `}
                    style={isWinner ? { backgroundColor: color, boxShadow: `0 0 20px ${color}66` } : {}}
                    >
                        {p.score}
                    </div>
                )}
            </div>
        );
    };

    const MatchNode: React.FC<{ match: BracketMatch }> = ({ match }) => {
        return (
            <div 
                id={`match-${match.id}`}
                className={`
                    relative w-[260px] md:w-[360px] bg-[#1a1b26] border rounded-lg md:rounded-xl overflow-hidden flex flex-col z-10
                    ${match.status === 'live' ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)] scale-105' : 'border-white/10'}
                    transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:scale-[1.02]
                `}
            >
                {/* Header (Match ID / Status) */}
                <div className="flex justify-between items-center px-3 py-1.5 md:px-5 md:py-2 bg-[#0f0f16] border-b border-white/5">
                    <span className="text-[9px] md:text-[10px] font-mono text-gray-500 uppercase tracking-widest">Match {match.id.split('_')[1]}</span>
                    {match.status === 'live' && (
                        <span className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] font-bold text-red-500 uppercase animate-pulse">
                            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500 shadow-[0_0_10px_red]"></span> Live Arena
                        </span>
                    )}
                    {match.status === 'finished' && (
                        <span className="text-[9px] md:text-[10px] font-bold text-gray-600 uppercase">Final Score</span>
                    )}
                </div>

                {/* Teams */}
                <div className="flex flex-col">
                    <TeamRow p={match.p1} isWinner={match.p1.isWinner} />
                    <TeamRow p={match.p2} isWinner={match.p2.isWinner} isBottom />
                </div>

                {/* Edit Action (Hover) */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink size={12} className="text-gray-500 hover:text-white cursor-pointer"/>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#020205] flex flex-col overflow-hidden animate-in fade-in duration-300 font-sans">
            
            {/* --- HEADER --- */}
            <div className="h-16 md:h-24 border-b border-white/5 bg-[#05050a] flex items-center justify-between px-4 md:px-10 shrink-0 relative z-50 shadow-2xl">
                <div className="flex items-center gap-4 md:gap-8">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black italic shadow-[0_0_20px_rgba(37,99,235,0.4)] text-xs md:text-base">TW</div>
                        <span className="font-bold text-lg md:text-xl tracking-[0.2em] text-white hidden md:inline font-cyber">GALAXIES</span>
                    </div>
                    <div className="h-8 md:h-10 w-[1px] bg-white/10 hidden md:block"></div>
                    <div>
                        <div className="text-[9px] md:text-[10px] text-blue-500 font-bold tracking-widest uppercase mb-0.5 md:mb-1">{gameName} Championship</div>
                        <h1 className="text-lg md:text-3xl font-black text-white leading-none tracking-tight flex items-center gap-3 font-cyber">
                            ULTIMATE CHALLENGE <span className="px-2 py-0.5 rounded bg-white/10 text-gray-300 text-[10px] md:text-xs font-sans tracking-normal border border-white/5 hidden md:inline">S4 FINALS</span>
                        </h1>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 md:gap-4">
                    <button className="hidden md:flex items-center justify-center px-8 py-3 rounded-full bg-white text-black hover:bg-gray-200 text-sm font-bold transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        <Share2 size={16} className="mr-2"/> Share Bracket
                    </button>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} className="md:w-6 md:h-6" />
                    </button>
                </div>
            </div>

            {/* --- MAIN AREA --- */}
            <div className="flex-1 overflow-hidden relative bg-[radial-gradient(circle_at_center,#11111e_0%,#020205_100%)]">
                
                {/* CENTER PANEL: BRACKET CANVAS */}
                <div className="absolute inset-0 flex flex-col bg-[#0b0b12] overflow-hidden">
                    {/* Scroll Container */}
                    <div 
                        ref={containerRef}
                        className="flex-1 overflow-auto relative custom-scrollbar flex items-center justify-start md:justify-center"
                        onScroll={drawConnections}
                    >
                        {/* The Drawing Layer (Behind content) */}
                        <canvas ref={canvasRef} className="absolute top-0 left-0 pointer-events-none z-0" />

                        {/* The Bracket Content */}
                        <div ref={contentRef} className="relative z-10 flex p-8 md:p-24 min-w-max mx-auto items-center">
                            
                            {/* Round 1 Column */}
                            <div className="flex flex-col gap-8 md:gap-12 justify-center">
                                <div className="text-center text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-[0.3em] mb-4 md:mb-8">Quarter Finals</div>
                                <div className="flex flex-col gap-8 md:gap-20">
                                    {matches.filter(m => m.round === 0).map(m => (
                                        <MatchNode key={m.id} match={m} />
                                    ))}
                                </div>
                            </div>

                            {/* Spacer */}
                            <div className="w-16 md:w-32 shrink-0"></div>

                            {/* Round 2 Column */}
                            <div className="flex flex-col gap-8 md:gap-12 justify-center pt-8 md:pt-16">
                                <div className="text-center text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-[0.3em] mb-4 md:mb-8">Semi Finals</div>
                                <div className="flex flex-col gap-24 md:gap-40"> 
                                    {matches.filter(m => m.round === 1).map(m => (
                                        <MatchNode key={m.id} match={m} />
                                    ))}
                                </div>
                            </div>

                            {/* Spacer */}
                            <div className="w-16 md:w-32 shrink-0"></div>

                            {/* Round 3 Column */}
                            <div className="flex flex-col gap-8 md:gap-12 justify-center pt-4 md:pt-8">
                                <div className="text-center text-[10px] md:text-xs font-bold text-yellow-500 uppercase tracking-[0.3em] mb-4 md:mb-8 flex items-center justify-center gap-2 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]"><Trophy size={14} className="md:w-4 md:h-4"/> Grand Final</div>
                                <div className="flex flex-col justify-center h-full pb-8">
                                    {matches.filter(m => m.round === 2).map(m => (
                                        <MatchNode key={m.id} match={m} />
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BracketOverlay;

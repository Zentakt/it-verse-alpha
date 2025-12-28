
import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Cpu, Zap, Brain, Shield, X, Check, Grid, Hash, Key, Lock, Eye, HelpCircle, AlertCircle, Timer } from 'lucide-react';
import { Challenge } from '../types';

interface ChallengeGamesProps {
    challenge: Challenge;
    onComplete: (success: boolean) => void;
    onClose: () => void;
}

// --- GAME 1: NEURAL LINK (SEQUENCE) - 5 Rounds ---
const NeuralLinkGame = ({ onWin }: { onWin: () => void }) => {
    const [sequence, setSequence] = useState<number[]>([]);
    const [playerSeq, setPlayerSeq] = useState<number[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeBtn, setActiveBtn] = useState<number | null>(null);
    const [round, setRound] = useState(1);
    
    // Config: 5 Rounds for "Time consuming"
    const GRID_SIZE = 9;
    const MAX_ROUNDS = 5;

    useEffect(() => {
        if (round === 1 && sequence.length === 0) {
            startRound();
        }
    }, [round]);

    const startRound = () => {
        setIsPlaying(true);
        setPlayerSeq([]);
        // Delay slightly for player to get ready
        setTimeout(() => {
            const newStep = Math.floor(Math.random() * GRID_SIZE);
            const nextSeq = [...sequence, newStep];
            setSequence(nextSeq);
            playSequence(nextSeq);
        }, 800);
    };

    const playSequence = (seq: number[]) => {
        setIsPlaying(true);
        let tl = gsap.timeline({
            onComplete: () => setIsPlaying(false)
        });

        seq.forEach((idx) => {
            tl.to({}, { duration: 0.2 }); // Gap
            tl.call(() => setActiveBtn(idx));
            tl.to({}, { duration: 0.5 }); // Light hold time
            tl.call(() => setActiveBtn(null));
        });
    };

    const handleTap = (idx: number) => {
        if (isPlaying) return;
        
        // Visual Feedback
        const btn = document.getElementById(`node-${idx}`);
        gsap.fromTo(btn, 
            { scale: 0.9, boxShadow: '0 0 0px cyan' }, 
            { scale: 1, boxShadow: '0 0 20px cyan', duration: 0.3, clearProps: 'all' }
        );

        if (navigator.vibrate) navigator.vibrate(10);

        const newPlayerSeq = [...playerSeq, idx];
        setPlayerSeq(newPlayerSeq);

        // Validate
        const step = newPlayerSeq.length - 1;
        if (newPlayerSeq[step] !== sequence[step]) {
            // Fail
            const grid = document.querySelector(".game-grid");
            gsap.to(grid, { x: 10, duration: 0.05, yoyo: true, repeat: 5, backgroundColor: 'rgba(255,0,0,0.1)' });
            gsap.to(grid, { backgroundColor: 'transparent', duration: 0.2, delay: 0.5 });
            
            // Reset Game completely on fail to make it harder/longer
            setSequence([]);
            setRound(1);
            setTimeout(startRound, 1000);
            return;
        }

        if (newPlayerSeq.length === sequence.length) {
            if (round >= MAX_ROUNDS) {
                onWin();
            } else {
                setRound(r => r + 1);
                setTimeout(startRound, 500); // Trigger next round
            }
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-sm">
            <div className="mb-6 flex items-center justify-between w-full px-4">
                <span className="text-cyan-400 font-mono tracking-widest text-xs">SYNC_LEVEL: {round}/{MAX_ROUNDS}</span>
                <Cpu size={20} className={`text-cyan-400 ${isPlaying ? 'animate-spin-slow' : ''}`} />
            </div>
            <div className="game-grid grid grid-cols-3 gap-3 w-full aspect-square p-4 bg-black/40 border border-cyan-500/30 rounded-xl relative">
                {[...Array(GRID_SIZE)].map((_, i) => (
                    <button
                        key={i}
                        id={`node-${i}`}
                        onClick={() => handleTap(i)}
                        className={`
                            rounded-lg border border-cyan-500/20 transition-all duration-150 relative overflow-hidden group
                            ${activeBtn === i ? 'bg-cyan-400 shadow-[0_0_25px_#00ffff] scale-95 border-transparent z-10' : 'bg-cyan-900/10 hover:bg-cyan-500/20'}
                        `}
                    >
                        <div className={`absolute inset-0 bg-cyan-400/30 transition-opacity ${activeBtn === i ? 'opacity-100' : 'opacity-0'}`}></div>
                        <div className="w-1 h-1 bg-cyan-500/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"></div>
                    </button>
                ))}
            </div>
            <p className="mt-6 text-gray-500 font-mono text-[10px] uppercase tracking-widest text-center animate-pulse">
                {isPlaying ? "RECEIVING SIGNAL..." : "REPEAT SEQUENCE"}
            </p>
        </div>
    );
};

// --- GAME 2: DATA PAIR SYNC (MEMORY) - 12 Cards ---
const MemoryGame = ({ onWin }: { onWin: () => void }) => {
    const ICONS = [Zap, Brain, Shield, Key, Grid, Hash];
    const [cards, setCards] = useState<{id: number, iconIdx: number, matched: boolean, flipped: boolean}[]>([]);
    const [locked, setLocked] = useState(false);
    const [moves, setMoves] = useState(0);

    // Init - 6 Pairs (12 Cards)
    useEffect(() => {
        const selection = ICONS.slice(0, 6); 
        const deck = [...selection, ...selection]
            .map((icon, i) => ({ id: i, iconIdx: selection.indexOf(icon), sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map((c, i) => ({ id: i, iconIdx: c.iconIdx, matched: false, flipped: false }));
        
        setCards(deck);
    }, []);

    const handleCardClick = (idx: number) => {
        if (locked || cards[idx].flipped || cards[idx].matched) return;

        // Flip
        const newCards = [...cards];
        newCards[idx].flipped = true;
        setCards(newCards);

        // Check active flips
        const active = newCards.filter(c => c.flipped && !c.matched);
        if (active.length === 2) {
            setLocked(true);
            setMoves(m => m + 1);
            
            // Match?
            if (active[0].iconIdx === active[1].iconIdx) {
                setTimeout(() => {
                    const matchedState = newCards.map(c => 
                        (c.id === active[0].id || c.id === active[1].id) 
                        ? { ...c, matched: true } : c
                    );
                    setCards(matchedState);
                    setLocked(false);
                    
                    // Win Condition
                    if (matchedState.every(c => c.matched)) onWin();
                }, 600);
            } else {
                setTimeout(() => {
                    const resetState = newCards.map(c => 
                        (c.id === active[0].id || c.id === active[1].id) 
                        ? { ...c, flipped: false } : c
                    );
                    setCards(resetState);
                    setLocked(false);
                }, 1000);
            }
        }
    };

    return (
        <div className="w-full max-w-sm">
            <div className="flex justify-between items-center mb-6 px-2">
                <span className="text-purple-400 font-mono text-xs tracking-widest">ATTEMPTS: {moves}</span>
                <span className="text-purple-400 font-mono text-xs tracking-widest">PAIRS: {cards.filter(c => c.matched).length / 2}/6</span>
            </div>
            <div className="grid grid-cols-4 gap-2 md:gap-3 perspective-1000">
                {cards.map((card, i) => {
                    const Icon = ICONS[card.iconIdx];
                    return (
                        <div 
                            key={i}
                            onClick={() => handleCardClick(i)}
                            className={`
                                relative aspect-square cursor-pointer transition-all duration-500 transform-style-3d
                                ${card.flipped ? 'rotate-y-180' : ''}
                                ${card.matched ? 'opacity-50 scale-90 pointer-events-none' : ''}
                            `}
                            style={{ transformStyle: 'preserve-3d', transform: card.flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                        >
                            {/* Front (Hidden) */}
                            <div className="absolute inset-0 bg-[#1a1a24] border border-purple-500/30 rounded-lg flex items-center justify-center backface-hidden shadow-[0_0_10px_rgba(168,85,247,0.1)] group hover:border-purple-400">
                                <div className="w-4 h-4 md:w-6 md:h-6 rounded-full border-2 border-purple-900/50 group-hover:border-purple-500/50"></div>
                            </div>
                            
                            {/* Back (Revealed) */}
                            <div className="absolute inset-0 bg-purple-900/80 border border-purple-400 rounded-lg flex items-center justify-center backface-hidden rotate-y-180 shadow-[0_0_20px_#a855f7]">
                                <Icon className="text-white w-5 h-5 md:w-8 md:h-8" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- GAME 3: FIREWALL BREACH (CIPHER) ---
const CipherGame = ({ challenge, onWin }: { challenge: Challenge, onWin: () => void }) => {
    const [input, setInput] = useState('');
    const [shake, setShake] = useState(false);

    const checkAnswer = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanInput = input.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanAnswer = challenge.answer.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (cleanInput === cleanAnswer) {
            onWin();
        } else {
            setShake(true);
            setInput('');
            setTimeout(() => setShake(false), 500);
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        }
    };

    return (
        <div className="w-full max-w-sm space-y-6">
            <div className="bg-green-900/10 border border-green-500/30 p-6 rounded-xl text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.05)_1px,transparent_1px)] bg-[length:100%_4px] pointer-events-none"></div>
                <Lock className="mx-auto text-green-500 mb-4" size={32} />
                <h4 className="text-green-400 font-mono text-xs tracking-widest mb-2">DECRYPTION CLUE</h4>
                <p className="text-white text-xl font-bold font-cyber tracking-wide">{challenge.question}</p>
            </div>
            
            <form onSubmit={checkAnswer} className={`relative ${shake ? 'animate-shake' : ''}`}>
                <input 
                    autoFocus
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="ENTER PASSKEY"
                    className="w-full bg-black/60 border border-green-500/50 text-center text-green-400 font-mono text-xl py-4 rounded-lg focus:outline-none focus:border-green-400 focus:shadow-[0_0_20px_rgba(34,197,94,0.3)] placeholder:text-green-900/50 uppercase tracking-widest"
                />
                <button 
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 aspect-square bg-green-600 hover:bg-green-500 text-black rounded flex items-center justify-center transition-colors"
                >
                    <Key size={20} />
                </button>
            </form>
            <div className="text-center">
                <span className="text-[10px] text-gray-500 font-mono tracking-[0.3em]">ENCRYPTION: AES-256</span>
            </div>
        </div>
    );
};

// --- GAME 4: QUIZ (MULTIPLE CHOICE) ---
const QuizGame = ({ challenge, onWin }: { challenge: Challenge, onWin: () => void }) => {
    const [currentQ, setCurrentQ] = useState(0);
    const [locked, setLocked] = useState(false);
    const [wrongSelection, setWrongSelection] = useState<number | null>(null);
    const [correctSelection, setCorrectSelection] = useState<number | null>(null);
    const [cooldown, setCooldown] = useState(0);

    const questions = challenge.gameConfig?.questions || [
        { q: "Error: No Questions Configured", options: ["Abort"], correct: 0 }
    ];

    const handleOptionSelect = (idx: number) => {
        if (locked) return;
        
        const q = questions[currentQ];
        if (idx === q.correct) {
            // Correct
            setCorrectSelection(idx);
            setLocked(true);
            setTimeout(() => {
                if (currentQ < questions.length - 1) {
                    setCurrentQ(curr => curr + 1);
                    setCorrectSelection(null);
                    setLocked(false);
                } else {
                    onWin();
                }
            }, 1000);
        } else {
            // Wrong - Punishment Delay
            setWrongSelection(idx);
            setLocked(true);
            setCooldown(3); // 3 Seconds penalty
            
            const timer = setInterval(() => {
                setCooldown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setLocked(false);
                        setWrongSelection(null);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
    };

    const qData = questions[currentQ];

    return (
        <div className="w-full max-w-sm space-y-6">
            <div className="flex justify-between items-end border-b border-yellow-500/20 pb-2">
                <span className="text-yellow-500 font-mono text-xs tracking-widest">
                    QUESTION {currentQ + 1}/{questions.length}
                </span>
                <Brain size={20} className="text-yellow-500" />
            </div>

            <div className="min-h-[80px] flex items-center justify-center text-center">
                <h3 className="text-white font-bold text-lg leading-tight">
                    {qData.q}
                </h3>
            </div>

            <div className="space-y-3">
                {qData.options.map((opt: string, i: number) => (
                    <button 
                        key={i}
                        onClick={() => handleOptionSelect(i)}
                        disabled={locked}
                        className={`
                            w-full p-4 rounded-lg border text-left font-mono text-sm font-bold transition-all relative overflow-hidden
                            ${correctSelection === i ? 'bg-green-600 border-green-400 text-black scale-105 shadow-[0_0_20px_rgba(34,197,94,0.5)]' : ''}
                            ${wrongSelection === i ? 'bg-red-900/50 border-red-500 text-red-200 shake' : ''}
                            ${!locked && correctSelection !== i && wrongSelection !== i ? 'bg-[#1a1a24] border-white/10 hover:bg-white/10 hover:border-yellow-500/50 text-gray-300' : ''}
                            ${locked && correctSelection !== i && wrongSelection !== i ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        <div className="flex items-center gap-3 relative z-10">
                            <span className="w-6 h-6 rounded flex items-center justify-center bg-black/40 text-[10px] border border-white/20">
                                {String.fromCharCode(65 + i)}
                            </span>
                            <span>{opt}</span>
                        </div>
                        {/* Cooldown Overlay for wrong answers */}
                        {wrongSelection === i && cooldown > 0 && (
                            <div className="absolute inset-0 bg-red-900/90 flex items-center justify-center gap-2 text-white font-black z-20">
                                <Timer size={16} className="animate-spin" /> 
                                LOCKOUT: {cooldown}s
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

const ChallengeGames: React.FC<ChallengeGamesProps> = ({ challenge, onComplete, onClose }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [gameState, setGameState] = useState<'intro' | 'playing' | 'success'>('intro');

    useEffect(() => {
        // Entrance Anim
        if(containerRef.current) {
            gsap.fromTo(containerRef.current, 
                { scale: 0.9, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.2)" }
            );
        }
    }, []);

    const handleWin = () => {
        setGameState('success');
        setTimeout(() => {
            onComplete(true);
        }, 1500);
    };

    const renderGame = () => {
        switch(challenge.gameType) {
            case 'sequence': return <NeuralLinkGame onWin={handleWin} />;
            case 'memory': return <MemoryGame onWin={handleWin} />;
            case 'cipher': return <CipherGame challenge={challenge} onWin={handleWin} />;
            case 'quiz': return <QuizGame challenge={challenge} onWin={handleWin} />;
            default: return <div className="text-red-500 p-4 border border-red-500 rounded">ERROR: UNKNOWN PROTOCOL TYPE '{challenge.gameType}'</div>;
        }
    };

    const getGameTitle = () => {
        switch(challenge.gameType) {
            case 'sequence': return "NEURAL SYNC";
            case 'memory': return "DATA PAIRING";
            case 'cipher': return "FIREWALL BREACH";
            case 'quiz': return "KNOWLEDGE CHECK";
            default: return "UNKNOWN PROTOCOL";
        }
    };

    const getThemeColor = () => {
        switch(challenge.gameType) {
            case 'sequence': return 'text-cyan-400';
            case 'memory': return 'text-purple-400';
            case 'cipher': return 'text-green-400';
            case 'quiz': return 'text-yellow-400';
            default: return 'text-white';
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div ref={containerRef} className="w-full max-w-md bg-[#0a0a10] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
                
                {/* Header */}
                <div className="bg-[#111] p-6 border-b border-white/5 flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-3">
                        <div className={`w-1 h-8 bg-gradient-to-b from-transparent via-white to-transparent rounded-sm opacity-50`}></div>
                        <div>
                            <div className="text-[10px] font-mono text-gray-500 tracking-[0.2em] uppercase">Security Layer</div>
                            <h2 className={`text-xl font-black font-cyber tracking-wide ${getThemeColor()}`}>{getGameTitle()}</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Game Area */}
                <div className="p-8 min-h-[400px] flex flex-col items-center justify-center relative">
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none"></div>
                    
                    {gameState === 'intro' && (
                        <div className="text-center space-y-6 animate-in fade-in zoom-in duration-300 relative z-10">
                            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 relative group">
                                <div className={`absolute inset-0 rounded-full border-2 border-t-transparent border-l-transparent animate-spin ${getThemeColor().replace('text', 'border')}`}></div>
                                <Shield size={40} className="text-white group-hover:scale-110 transition-transform" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2 font-cyber tracking-wide">{challenge.title}</h3>
                                <p className="text-gray-400 text-sm max-w-xs mx-auto font-ui">{challenge.description || "Complete the protocol to access the reward data."}</p>
                            </div>
                            <button 
                                onClick={() => setGameState('playing')}
                                className="px-8 py-3 bg-white text-black font-black font-cyber tracking-widest rounded-lg hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2 mx-auto"
                            >
                                <Eye size={18} /> INITIATE LINK
                            </button>
                        </div>
                    )}

                    {gameState === 'playing' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex justify-center relative z-10">
                            {renderGame()}
                        </div>
                    )}

                    {gameState === 'success' && (
                        <div className="text-center space-y-6 animate-in zoom-in duration-300 relative z-10">
                            <div className="w-32 h-32 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/50 shadow-[0_0_50px_rgba(34,197,94,0.4)]">
                                <Check size={64} className="text-green-400 drop-shadow-md" />
                            </div>
                            <h2 className="text-3xl font-black font-cyber text-white tracking-widest">ACCESS GRANTED</h2>
                            <p className="text-green-400 font-mono text-xs tracking-[0.2em] animate-pulse">DECRYPTING REWARD DATA...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChallengeGames;

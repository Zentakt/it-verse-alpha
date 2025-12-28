
import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { GameEvent, Team } from '../types';
import { Play, ChevronLeft, ChevronRight, Zap, Star, Tag, Trophy, ArrowLeft, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// --- SHARED COMPONENTS ---

const LiveBadge: React.FC = () => (
    <div className="inline-flex items-center gap-1.5 bg-[#ea0029] text-white text-[10px] font-bold px-2 py-0.5 rounded-[2px] uppercase tracking-wider shadow-lg">
        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        LIVE
    </div>
);

const TagPill: React.FC<{ label: string }> = ({ label }) => (
    <span className="text-[10px] font-bold text-gray-400 bg-[#1a1a1f] px-2 py-0.5 rounded border border-white/5 uppercase tracking-wide">
        {label}
    </span>
);

// --- GLITCH CARD COMPONENT (REFINED) ---

const GLITCH_COLORS = ['#ff00de', '#00ffff', '#ffff00', '#ff0000', '#00ff00', '#7c3aed'];

const GameCard: React.FC<{ item: GameEvent; onSelect: (evt: GameEvent) => void }> = ({ item, onSelect }) => {
    const [accentColor, setAccentColor] = useState('#9333ea');
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => {
        setIsHovered(true);
        setAccentColor(GLITCH_COLORS[Math.floor(Math.random() * GLITCH_COLORS.length)]);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    return (
        <div 
            onClick={() => onSelect(item)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="w-[280px] md:w-[320px] cursor-pointer group relative"
            style={{ paddingLeft: '6px', paddingBottom: '6px' }} // Reserve space for the offset
        >
            {/* SOLID OFFSET BORDER (The "Shadow" Block) - Fixed to Bottom-Left */}
            <div 
                className="absolute inset-0 bg-[var(--accent)] z-0 transition-all duration-200 ease-out rounded-sm"
                style={{ 
                    '--accent': isHovered ? accentColor : '#1f1f23', 
                    // Position absolute 0 covers the reserved padding area, creating the offset effect naturally
                    top: '6px', 
                    left: '0px',
                    right: '6px',
                    bottom: '0px',
                } as React.CSSProperties}
            ></div>

            {/* Thumbnail Container (Top Layer) */}
            <div className="relative z-10 flex flex-col gap-3 bg-[#0e0e10] p-0 transition-transform duration-200"
                 style={{ transform: isHovered ? 'translate(2px, -2px)' : 'translate(0, 0)' }}
            >
                <div className="relative aspect-video bg-[#1f1f23] overflow-hidden border border-white/5">
                    <img src={item.image} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    
                    {/* Live Badge */}
                    <div className="absolute top-2 left-2">
                        <LiveBadge />
                    </div>

                    {/* Viewer Count Overlay */}
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span> {Math.floor(Math.random() * 2000) + 500} viewers
                    </div>
                    
                    {/* Hover Glitch Overlay */}
                    <div className={`absolute inset-0 bg-white/10 pointer-events-none mix-blend-overlay transition-opacity duration-100 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20"></div>
                    </div>
                </div>
                
                {/* Meta Info */}
                <div className="pr-2 relative z-10 pl-1 pb-1">
                    <div className="flex justify-between items-start">
                        <h4 
                            className="text-base font-bold text-white leading-tight mb-1 truncate transition-colors duration-200" 
                            style={{ textShadow: isHovered ? `0 0 10px ${accentColor}80` : 'none' }}
                            title={item.title}
                        >
                            {item.title}
                        </h4>
                    </div>
                    <div className="text-xs text-gray-400 hover:text-white transition-colors mb-2">
                        {item.game}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <TagPill label="Esports" />
                        {item.bracketType && <TagPill label={item.bracketType} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- HERO CAROUSEL COMPONENT ---

interface HeroShowcaseProps {
    events: GameEvent[];
    onPlay: (evt: GameEvent) => void;
}

const HeroShowcase: React.FC<HeroShowcaseProps> = ({ events, onPlay }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    
    // Refs for animation
    const heroRef = useRef<HTMLDivElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const carouselRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const activeEvent = events[activeIndex];

    const handleNext = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setActiveIndex(prev => (prev + 1) % events.length);
        setIsAutoPlaying(false);
    };

    const handlePrev = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setActiveIndex(prev => (prev - 1 + events.length) % events.length);
        setIsAutoPlaying(false);
    };

    // Auto-rotation
    useEffect(() => {
        if (isAutoPlaying) {
            timerRef.current = setTimeout(() => {
                setActiveIndex(prev => (prev + 1) % events.length);
            }, 8000);
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [activeIndex, isAutoPlaying, events.length]);

    // Animations when activeIndex changes
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            // Text Stagger
            if (textRef.current) {
                gsap.fromTo(textRef.current.children, 
                    { y: 20, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" }
                );
            }
            
            // BG Fade
            if (bgRef.current) {
                gsap.fromTo(bgRef.current,
                    { scale: 1.1, opacity: 0.5 },
                    { scale: 1, opacity: 1, duration: 1.5, ease: "power2.out" }
                );
            }

            // Scroll carousel to keep active item visible
            if (carouselRef.current) {
                const activeCard = carouselRef.current.children[activeIndex] as HTMLElement;
                if (activeCard) {
                    activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
            }

        }, heroRef);
        return () => ctx.revert();
    }, [activeIndex]);

    if (!activeEvent) return null;

    return (
        <div 
            ref={heroRef} 
            className="relative w-full h-[450px] md:h-[650px] overflow-hidden group mb-8 md:mb-12 bg-[#0e0e10]"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
        >
            {/* 1. CINEMATIC BACKGROUND */}
            <div className="absolute inset-0">
                <div ref={bgRef} key={`bg-${activeEvent.id}`} className="absolute inset-0">
                    <img 
                        src={activeEvent.image} 
                        alt="Hero BG" 
                        className="w-full h-full object-cover transition-opacity duration-1000" 
                    />
                    {/* Strong Gradient Overlay for Text Readability (Left Side) */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e10] via-[#0e0e10]/60 to-transparent w-[85%]"></div>
                    {/* Bottom Gradient for Carousel */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e10] via-transparent to-transparent opacity-90"></div>
                </div>
            </div>

            {/* 2. MAIN CONTENT (LEFT) */}
            <div className="absolute inset-0 flex flex-col justify-center px-4 md:px-16 z-10 pointer-events-none">
                <div ref={textRef} className="max-w-2xl flex flex-col items-start pointer-events-auto pb-28 md:pb-0">
                    {/* Top Meta */}
                    <div className="flex items-center gap-3 mb-2 md:mb-4">
                        <LiveBadge />
                        <span className="text-gray-300 font-bold font-mono tracking-widest text-xs uppercase bg-black/30 backdrop-blur px-2.5 py-1 rounded border border-white/10">
                            {activeEvent.bracketType} Tournament
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black font-cyber text-white leading-[0.9] tracking-tighter mb-2 md:mb-4 drop-shadow-xl text-shadow-glow">
                        {activeEvent.title}
                    </h1>

                    {/* Author/Game Info */}
                    <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 bg-black/40 backdrop-blur-md p-1.5 md:p-2 pr-4 md:pr-6 rounded-full border border-white/10">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white shadow-lg text-xs md:text-base">
                            {activeEvent.game.substring(0, 1)}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-bold text-sm md:text-base leading-none flex items-center gap-2">
                                {activeEvent.game} <span className="text-blue-400 text-xs">✓</span>
                            </span>
                            <span className="text-gray-400 text-xs md:text-sm">Official Broadcast</span>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-300 text-sm md:text-lg leading-relaxed max-w-lg mb-6 md:mb-8 line-clamp-2 md:line-clamp-3">
                        {activeEvent.description}
                    </p>

                    {/* CTA */}
                    <button 
                        onClick={() => onPlay(activeEvent)}
                        className="group relative flex items-center gap-2 md:gap-3 bg-[#5c54f0] hover:bg-[#4f46e5] text-white px-5 py-2.5 md:px-8 md:py-4 rounded-lg font-black font-cyber tracking-widest text-sm md:text-lg transition-all shadow-[0_0_30px_rgba(92,84,240,0.4)] hover:shadow-[0_0_50px_rgba(92,84,240,0.6)] active:scale-95"
                    >
                        <Play fill="white" className="w-3 h-3 md:w-5 md:h-5" />
                        <span>WATCH NOW</span>
                    </button>
                </div>
            </div>

            {/* 3. THUMBNAIL NAVIGATOR (BOTTOM RIGHT FLOATING) */}
            <div className="absolute bottom-6 right-0 left-0 md:bottom-10 md:left-auto md:right-12 z-20 flex flex-col gap-2 md:gap-3 px-4 md:px-0">
                
                {/* Navigation Header - VISIBLE ON MOBILE NOW */}
                <div className="flex justify-end items-center mb-1 gap-4">
                    <div className="flex gap-1 bg-black/40 backdrop-blur rounded-full p-1 border border-white/5">
                        <button 
                            onClick={handlePrev}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                            aria-label="Previous Slide"
                        >
                            <ChevronLeft size={20} strokeWidth={1.5} />
                        </button>
                        <button 
                            onClick={handleNext}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                             aria-label="Next Slide"
                        >
                            <ChevronRight size={20} strokeWidth={1.5} />
                        </button>
                    </div>
                </div>

                {/* Carousel Strip */}
                <div className="relative w-full md:w-[600px] overflow-hidden mask-fade-right">
                    <div 
                        ref={carouselRef}
                        className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory py-2 px-1 [&::-webkit-scrollbar]:hidden"
                        style={{ scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {events.map((evt, idx) => {
                            const isActive = idx === activeIndex;
                            return (
                                <div 
                                    key={evt.id}
                                    onClick={() => { setActiveIndex(idx); setIsAutoPlaying(false); }}
                                    className={`
                                        relative shrink-0 w-[130px] md:w-[200px] aspect-video rounded-lg overflow-hidden cursor-pointer transition-all duration-300 snap-start
                                        ${isActive ? 'ring-2 ring-purple-500 scale-105 shadow-[0_0_20px_rgba(0,0,0,0.5)] z-10' : 'opacity-60 hover:opacity-100 hover:scale-105 grayscale hover:grayscale-0'}
                                    `}
                                >
                                    <img src={evt.image} alt="" className="w-full h-full object-cover" />
                                    
                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                                    
                                    {/* Active Indicator */}
                                    {isActive && (
                                        <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 scale-75 md:scale-100 origin-top-left">
                                            <LiveBadge />
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="absolute bottom-0 left-0 w-full p-2 md:p-3">
                                        <div className="text-[10px] md:text-sm font-bold text-purple-300 truncate mb-0.5">{evt.game}</div>
                                        <div className="text-xs md:text-base font-bold text-white truncate leading-tight">{evt.title}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SCROLL ROW ---

interface ScrollRowProps {
    title: string;
    subtitle?: string;
    items: GameEvent[];
    onSelect: (evt: GameEvent) => void;
}

const HorizontalRow: React.FC<ScrollRowProps> = ({ title, subtitle, items, onSelect }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rowRef = useRef<HTMLDivElement>(null);

    // Stagger Reveal
    useEffect(() => {
        if (!rowRef.current) return;
        ScrollTrigger.create({
            trigger: rowRef.current,
            start: "top 85%",
            onEnter: () => {
                gsap.fromTo(rowRef.current?.querySelectorAll('.scroll-item'), 
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" }
                );
            },
            once: true
        });
    }, []);

    const scroll = (dir: 'left' | 'right') => {
        if (!containerRef.current) return;
        const amount = containerRef.current.clientWidth * 0.7;
        containerRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    };

    return (
        <div ref={rowRef} className="w-full max-w-[1800px] mx-auto px-4 md:px-8 mb-12">
            
            {/* HEADER with Navigation Arrows Inline */}
            <div className="flex items-center justify-between mb-4 group cursor-pointer">
                <div className="flex items-end gap-3 flex-wrap">
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors flex items-center gap-2">
                        {title}
                    </h3>
                    {subtitle && <span className="text-sm text-gray-500 font-semibold mb-0.5 hidden md:inline-block">{subtitle}</span>}
                </div>

                {/* Inline Arrows - VISIBLE ON MOBILE NOW */}
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => scroll('left')} 
                        className="p-1.5 rounded hover:bg-white/10 text-white transition-colors active:scale-95"
                        aria-label="Scroll Left"
                    >
                        <ChevronLeft size={24} strokeWidth={1.5} />
                    </button>
                    <button 
                        onClick={() => scroll('right')} 
                        className="p-1.5 rounded hover:bg-white/10 text-white transition-colors active:scale-95"
                        aria-label="Scroll Right"
                    >
                        <ChevronRight size={24} strokeWidth={1.5} />
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            <div className="relative group/scroll">
                <div 
                    ref={containerRef}
                    // Adjusted padding pl-5 to perfectly align the offset border of the first item with header text
                    className="flex gap-4 overflow-x-auto pb-6 pt-2 pl-5 pr-5 snap-x snap-mandatory scrollbar-hide [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {items.map((item, i) => (
                        <div key={`${item.id}-${i}`} className="scroll-item flex-none snap-start">
                            <GameCard item={item} onSelect={onSelect} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---

interface GamesGridProps {
  events: GameEvent[];
  teams: Record<string, Team>;
  onSelectEvent: (event: GameEvent) => void;
}

const GamesGrid: React.FC<GamesGridProps> = ({ events, onSelectEvent }) => {
    
    // Duplicate events for scroll demo
    const liveItems = [...events, ...events, ...events].map((e,i) => ({...e, id: `${e.id}_live_${i}`}));
    
    return (
        <div className="min-h-screen bg-[#0e0e10] font-sans pb-20">
            
            <HeroShowcase events={events} onPlay={onSelectEvent} />

            <HorizontalRow 
                title="Live channels we think you'll like" 
                items={liveItems}
                onSelect={onSelectEvent}
            />

            {/* Removed Categories Section */}

            <HorizontalRow 
                title="Recommended" 
                items={liveItems.reverse()}
                onSelect={onSelectEvent}
            />

        </div>
    );
};

export default GamesGrid;


import React from 'react';
import { 
    ChevronLeft, Facebook, Twitter, Youtube, Dribbble, Trophy, 
    Gamepad2, Download, MoreHorizontal, Target, Swords
} from 'lucide-react';

// --- CUSTOM GAME ICONS TO MATCH REFERENCE ---
const ValorantLogo = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M2 2h20v20H2z" fill="none"/>
        <path d="M12.5 2L3 22h18L12.5 2z" transform="scale(0.8) translate(3,1)" />
    </svg>
);

const DotaLogo = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M7 7h10v10H7z" fill="currentColor" transform="scale(0.6) translate(8,8)"/>
    </svg>
);

const ApexLogo = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2L2 20h20L12 2zm0 4l5 12H7l5-12z" />
    </svg>
);

const LeagueLogo = () => (
    <span className="font-serif font-black italic text-4xl">L</span>
);

const TournamentsView: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#05050a] text-white p-4 md:p-8 flex justify-center pt-24 pb-20 font-sans">
      
      {/* MAIN CARD CONTAINER */}
      {/* Using pseudo-elements to create the specific double-border tech look with cut corners */}
      <div className="w-full max-w-[1400px] relative bg-[#0b0b14] z-10">
        
        {/* Clip Path Shape */}
        <div 
            className="absolute inset-0 border-[1px] border-white/10 pointer-events-none z-20"
            style={{
                clipPath: 'polygon(40px 0, 100% 0, 100% calc(100% - 40px), calc(100% - 40px) 100%, 0 100%, 0 40px)',
            }}
        ></div>
        
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-[42px] h-[42px] z-30 pointer-events-none">
             <div className="absolute top-[14px] left-[14px] w-[40px] h-[2px] bg-[#4f46e5] -rotate-45 origin-top-left"></div>
        </div>
        <div className="absolute bottom-0 right-0 w-[42px] h-[42px] z-30 pointer-events-none">
             <div className="absolute bottom-[14px] right-[14px] w-[40px] h-[2px] bg-[#4f46e5] -rotate-45 origin-bottom-right"></div>
        </div>

        {/* Content Wrapper with Clip Path */}
        <div 
            className="w-full h-full bg-[#0b0b14] grid grid-cols-1 lg:grid-cols-12 relative overflow-hidden"
            style={{
                clipPath: 'polygon(40px 0, 100% 0, 100% calc(100% - 40px), calc(100% - 40px) 100%, 0 100%, 0 40px)',
            }}
        >
            
            {/* --- LEFT SIDEBAR (PROFILE) --- */}
            <div className="lg:col-span-4 bg-[#0f0f1a] p-8 md:p-12 border-r border-white/5 flex flex-col relative">
                
                {/* Back Link */}
                <button className="flex items-center gap-3 text-sm font-bold text-gray-400 hover:text-white uppercase tracking-widest mb-12 transition-colors group">
                    <div className="w-8 h-8 bg-[#1a1a24] rounded flex items-center justify-center group-hover:bg-[#4f46e5] transition-colors">
                        <ChevronLeft size={16} />
                    </div>
                    Back to Player List
                </button>

                {/* Avatar & Name */}
                <div className="mb-10">
                    <div className="relative w-32 h-32 mb-6">
                        <div className="absolute inset-0 rounded-full p-[2px] bg-gradient-to-b from-[#4f46e5] to-transparent">
                            <div className="w-full h-full rounded-full bg-[#0f0f1a] p-1">
                                <img 
                                    src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80" 
                                    className="w-full h-full object-cover rounded-full grayscale" 
                                    alt="Profile"
                                />
                            </div>
                        </div>
                        <div className="absolute bottom-2 right-1 w-5 h-5 bg-[#22c55e] rounded-full border-2 border-[#0f0f1a] shadow-[0_0_10px_#22c55e]"></div>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-black font-cyber text-white mb-4 tracking-wide">Old Morty</h1>
                    
                    {/* UPDATED: Larger Rank Badges */}
                    <div className="flex gap-6 text-base font-mono font-bold text-gray-300">
                        <span className="flex items-center gap-3"><div className="w-3 h-3 bg-[#4f46e5] rounded-full shadow-[0_0_8px_#4f46e5]"></div> #332</span>
                        <span className="flex items-center gap-3"><div className="w-3 h-3 bg-[#3b82f6] rounded-full shadow-[0_0_8px_#3b82f6]"></div> #151</span>
                        <span className="flex items-center gap-3"><div className="w-3 h-3 bg-[#ef4444] rounded-full shadow-[0_0_8px_#ef4444]"></div> #12</span>
                    </div>
                </div>

                {/* Gamer Rank Card */}
                <div className="bg-[#13131c] rounded-xl p-6 border border-white/5 flex items-center justify-between mb-10 group hover:border-[#4f46e5]/30 transition-colors">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-full bg-[#1a1a24] flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                            <Swords size={24} />
                        </div>
                        <div>
                            {/* UPDATED: Larger Label */}
                            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Gamer Rank</div>
                            <div className="text-5xl font-black font-cyber text-white tracking-widest">326</div>
                        </div>
                    </div>
                    {/* Tech Graphic Lines */}
                    <div className="flex flex-col gap-1.5 items-end opacity-50">
                        <div className="w-10 h-0.5 bg-[#4f46e5]"></div>
                        <div className="w-6 h-0.5 bg-[#4f46e5]"></div>
                        <div className="w-4 h-0.5 bg-[#4f46e5]"></div>
                    </div>
                </div>

                {/* Mini Stats */}
                <div className="grid grid-cols-3 gap-3 mb-12">
                    {[
                        { l: 'SHOOTER', v: '1,250' },
                        { l: 'MOBA', v: '250' },
                        { l: 'SPORTS', v: '10,250' }
                    ].map((s, i) => (
                        <div key={i} className="bg-[#13131c] border border-white/5 rounded py-4 px-3 text-center">
                            {/* UPDATED: Larger Label & Value */}
                            <div className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">{s.l}</div>
                            <div className="text-xl font-bold text-white font-mono">{s.v}</div>
                        </div>
                    ))}
                </div>

                {/* About Me */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-3">
                            <div className="w-1.5 h-5 bg-[#4f46e5] rounded-full"></div> About me
                        </h3>
                        <div className="flex gap-4 text-gray-500">
                            <Facebook size={18} className="hover:text-[#4f46e5] cursor-pointer transition-colors"/>
                            <Twitter size={18} className="hover:text-[#4f46e5] cursor-pointer transition-colors"/>
                            <Youtube size={18} className="hover:text-[#4f46e5] cursor-pointer transition-colors"/>
                            <Dribbble size={18} className="hover:text-[#4f46e5] cursor-pointer transition-colors"/>
                        </div>
                    </div>
                    <p className="text-base text-gray-300 leading-7 font-ui">
                        There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable.
                    </p>
                </div>

                {/* Resume Button */}
                <button className="w-full h-14 bg-gradient-to-r from-[#4f46e5] to-[#4338ca] text-white font-bold text-sm uppercase tracking-widest rounded flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 mb-12 hover:brightness-110 transition-all">
                    Download my resume 
                    <span className="bg-black/20 px-2 py-1 rounded text-xs font-mono opacity-90">PDF - 2.2MB</span>
                </button>

                {/* Achievements */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-3">
                            <Trophy size={20} className="text-[#4f46e5]" /> Best Achievements
                        </h3>
                        <button className="text-xs font-bold text-gray-400 border border-white/10 px-3 py-1.5 rounded hover:text-white transition-colors uppercase tracking-wider">View All</button>
                    </div>
                    <div className="space-y-4">
                        {[
                            { t: 'Cyber League Champion', d: 'APRIL 29, 2022', img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=100&q=80' },
                            { t: 'Tactical Master', d: 'MARCH 15, 2022', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&q=80' }
                        ].map((a, i) => (
                            <div key={i} className="flex items-center gap-5 group cursor-pointer p-2 rounded hover:bg-white/5 transition-colors">
                                <div className="w-12 h-12 rounded-full bg-[#1a1a24] p-0.5 group-hover:bg-[#4f46e5] transition-colors shrink-0">
                                    <img src={a.img} className="w-full h-full rounded-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-white group-hover:text-[#4f46e5] transition-colors mb-1">{a.t}</div>
                                    {/* UPDATED: Larger Date */}
                                    <div className="text-sm font-bold text-gray-400 uppercase tracking-wide">{a.d}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* --- RIGHT CONTENT AREA --- */}
            <div className="lg:col-span-8 p-8 md:p-12 relative">
                
                {/* Header Nav */}
                <div className="flex justify-end gap-10 mb-14 text-sm font-bold uppercase tracking-[0.15em] text-gray-500">
                    <a href="#" className="text-white border-b-2 border-[#4f46e5] pb-2">Features</a>
                    <a href="#" className="hover:text-white transition-colors">About Us</a>
                    <a href="#" className="hover:text-white transition-colors">Download</a>
                    <a href="#" className="hover:text-white transition-colors">Sign In</a>
                </div>

                {/* MY GAMES SECTION */}
                <div className="mb-14">
                    {/* UPDATED: Larger Label */}
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">My Games</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                        {[
                            { name: 'VALORANT', id: '#320', bg: 'bg-[#6d28d9]', icon: <ValorantLogo />, active: true },
                            { name: 'DOTA 2', id: '#890', bg: 'bg-[#18181b]', icon: <DotaLogo /> },
                            { name: 'LEAGUE', id: '#120', bg: 'bg-[#09090b]', icon: <LeagueLogo /> },
                            { name: 'APEX', id: '#12', bg: 'bg-[#7f1d1d]', icon: <ApexLogo /> },
                            { name: 'VALORANT', id: '#520', bg: 'bg-[#27272a]', icon: <ValorantLogo /> }
                        ].map((g, i) => (
                            <div 
                                key={i} 
                                className={`
                                    relative h-44 rounded-lg flex flex-col items-center justify-center group cursor-pointer transition-transform hover:-translate-y-1
                                    ${g.bg}
                                `}
                            >
                                {g.active && <div className="absolute top-3 right-3 w-2 h-2 bg-white rounded-full shadow-[0_0_8px_white]"></div>}
                                <div className="text-white opacity-40 w-16 h-16 flex items-center justify-center mb-4 group-hover:opacity-100 transition-opacity">
                                    {g.icon}
                                </div>
                                <div className="absolute bottom-5 text-center w-full">
                                    {/* UPDATED: Larger Label */}
                                    <div className="text-sm font-bold text-white/70 tracking-widest mb-1">{g.name}</div>
                                    <div className="text-base font-bold text-white">{g.id}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* VALORANT STATS */}
                <div className="mb-14">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <Gamepad2 size={24} className="text-[#4f46e5]" />
                            <h3 className="text-xl font-bold text-white tracking-wide">Valorant Stats</h3>
                        </div>
                        <button className="text-xs font-bold bg-[#4f46e5] text-white px-6 py-2.5 rounded uppercase hover:bg-[#4338ca] transition-colors shadow-lg shadow-indigo-500/20 tracking-wider">View All</button>
                    </div>

                    <div className="bg-[#13131c] rounded-2xl p-10 border border-white/5">
                        
                        {/* Upper Stats */}
                        <div className="flex flex-col md:flex-row justify-between items-center border-b border-white/5 pb-10 mb-10 gap-10">
                            {/* Score */}
                            <div className="text-center md:text-left">
                                <div className="text-7xl font-black font-cyber text-white mb-2 tracking-wide">320</div>
                                {/* UPDATED: Larger Label */}
                                <div className="text-sm font-bold text-gray-400 uppercase tracking-[0.25em]">Gamer Score</div>
                            </div>
                            
                            {/* Rank */}
                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <div className="text-5xl font-bold text-white font-sans mb-2">Dia I</div>
                                    {/* UPDATED: Larger Label */}
                                    <div className="text-sm font-bold text-gray-400 uppercase tracking-[0.25em]">In-Game Rank</div>
                                </div>
                                <div className="w-20 h-20 bg-gradient-to-br from-[#a855f7] to-[#3b82f6] rounded-2xl rotate-45 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.2)] border-2 border-white/10">
                                    <div className="w-10 h-10 bg-white/20 -rotate-45"></div>
                                </div>
                            </div>
                        </div>

                        {/* Lower Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center md:text-left">
                            {[
                                { l: 'K/D RATIO', v: '12.2' },
                                { l: 'DMG/ROUND', v: '162.3' },
                                { l: 'HEADSHOTS %', v: '27%' },
                                { l: 'WIN %', v: '62.3%' }
                            ].map((s, i) => (
                                <div key={i} className="group">
                                    <div className="text-3xl font-bold text-white font-mono mb-2 group-hover:text-[#4f46e5] transition-colors">{s.v}</div>
                                    {/* UPDATED: Larger Label */}
                                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">{s.l}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RECENT MATCHES */}
                <div>
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-[#4f46e5] rounded-full"></div>
                            <h3 className="text-xl font-bold text-white tracking-wide">Recent matches</h3>
                        </div>
                        <button className="text-xs font-bold bg-[#1d1d29] text-white px-6 py-2.5 rounded uppercase hover:bg-[#252533] border border-white/5 transition-colors tracking-wider">View All</button>
                    </div>

                    <div className="space-y-4">
                        {[
                            { agent: 'Phoenix', kills: 12, deaths: 2, result: 'Victory', id: '2022040501', color: 'from-orange-500 to-red-600' },
                            { agent: 'Jett', kills: 12, deaths: 2, result: 'Victory', id: '2022040501', color: 'from-cyan-400 to-blue-500' },
                            { agent: 'Phoenix', kills: 12, deaths: 2, result: 'Victory', id: '2022040501', color: 'from-orange-500 to-red-600' },
                            { agent: 'Agent', kills: 12, deaths: 2, result: 'Victory', id: '2022040501', color: 'from-purple-500 to-pink-500' },
                        ].map((m, i) => (
                            <div key={i} className="bg-[#13131c] hover:bg-[#181824] rounded-xl p-5 flex flex-wrap md:flex-nowrap items-center justify-between transition-colors group border border-transparent hover:border-white/5">
                                
                                {/* Agent Info */}
                                <div className="flex items-center gap-5 w-full md:w-1/3 mb-4 md:mb-0">
                                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${m.color} p-[2px]`}>
                                        <div className="w-full h-full bg-[#13131c] rounded-full flex items-center justify-center overflow-hidden opacity-80">
                                            {/* Placeholder */}
                                            <div className={`w-full h-full bg-gradient-to-br ${m.color} opacity-50`}></div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        {/* UPDATED: Larger Label */}
                                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">AGENT</span>
                                        <span className="text-lg font-bold text-white">{m.agent}</span>
                                    </div>
                                </div>

                                {/* K/D */}
                                <div className="flex gap-16 w-full md:w-auto mb-4 md:mb-0">
                                    <div className="flex flex-col items-center w-12">
                                        {/* UPDATED: Larger Label */}
                                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">KILLS</span>
                                        <span className="text-lg font-bold text-white">{m.kills}</span>
                                    </div>
                                    <div className="flex flex-col items-center w-12">
                                        {/* UPDATED: Larger Label */}
                                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">DEATHS</span>
                                        <span className="text-lg font-bold text-white">{m.deaths}</span>
                                    </div>
                                </div>

                                {/* Result */}
                                <div className="flex flex-col items-end w-1/2 md:w-auto">
                                    {/* UPDATED: Larger Label */}
                                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">RESULT</span>
                                    <span className="text-lg font-bold text-[#22c55e]">{m.result}</span>
                                </div>

                                {/* ID */}
                                <div className="flex flex-col items-end w-1/2 md:w-auto">
                                    {/* UPDATED: Larger Label */}
                                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">MATCH ID</span>
                                    <span className="text-sm font-mono text-gray-500 group-hover:text-gray-300 transition-colors">{m.id}</span>
                                </div>

                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentsView;

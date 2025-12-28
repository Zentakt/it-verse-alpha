
import React, { useState, useEffect } from 'react';
import { AppState, GameEvent, Match, Team, BracketMatch } from '../types';
import { Settings, PlayCircle, Clock, Save, X, Activity, Trophy, Swords, Tv, Plus, Minus, Edit3, Users, Crown, ChevronRight, LayoutTemplate, Database, Image as ImageIcon, Upload, Link as LinkIcon, Monitor, Youtube, Twitch, Facebook, FileText, Calendar } from 'lucide-react';

interface AdminPanelProps {
  appState: AppState;
  events: GameEvent[];
  teams: Record<string, Team>;
  bracketData: any[]; 
  updateCountdown: (date: string) => void;
  updateMatchStatus: (eventId: string, matchId: string, status: Match['status']) => void;
  updateMatchStream: (eventId: string, matchId: string, streamUrl: string) => void;
  updateTeamPoints: (teamId: string, points: number, source: string) => void;
  updateBracketMatch: (matchId: string, p1Score: number | null, p2Score: number | null, status: string) => void;
  updateEventBracketMatch: (eventId: string, matchId: string, p1Score: number | null, p2Score: number | null, status: string) => void;
  updateEvent?: (eventId: string, updates: Partial<GameEvent>) => void; 
  updateTeam?: (teamId: string, updates: Partial<Team>) => void;
  toggleConfetti: () => void;
}

// ... (StreamEditor Component remains the same) ...
const StreamEditor = ({ match, eventId, onSave }: { match: Match, eventId: string, onSave: (eId: string, mId: string, url: string) => void }) => {
    const [type, setType] = useState<'twitch'|'youtube'|'facebook'|'custom'>('twitch');
    const [val, setVal] = useState('');

    useEffect(() => {
        if (!match.streamUrl) { setVal(''); return; }
        if (match.streamUrl.includes('twitch.tv')) { setType('twitch'); try { const url = new URL(match.streamUrl); const channel = url.searchParams.get('channel'); if (channel) setVal(channel); } catch (e) { setVal(match.streamUrl); } } 
        else if (match.streamUrl.includes('youtube.com') || match.streamUrl.includes('youtu.be')) { setType('youtube'); setVal(match.streamUrl); } 
        else if (match.streamUrl.includes('facebook.com')) { setType('facebook'); try { const url = new URL(match.streamUrl); const href = url.searchParams.get('href'); if (href) setVal(decodeURIComponent(href)); } catch (e) { setVal(match.streamUrl); } } 
        else { setType('custom'); setVal(match.streamUrl); }
    }, [match.streamUrl]);

    const handleSave = () => {
        let finalUrl = val;
        if (!val) { onSave(eventId, match.id, ''); return; }
        if (type === 'twitch') { let channel = val; if(val.includes('twitch.tv/')) channel = val.split('twitch.tv/')[1]?.split('/')[0] || val; finalUrl = `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&muted=false`; } 
        else if (type === 'youtube') { let vId = val; if (val.includes('v=')) vId = val.split('v=')[1]?.split('&')[0] || vId; else if (val.includes('youtu.be/')) vId = val.split('youtu.be/')[1]?.split('?')[0] || vId; finalUrl = `https://www.youtube.com/embed/${vId}?autoplay=1`; } 
        else if (type === 'facebook') { finalUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(val)}&show_text=false&t=0`; }
        onSave(eventId, match.id, finalUrl);
    };

    return (
        <div className="bg-black/30 p-4 rounded-lg border border-white/5 space-y-4">
            <div className="flex items-center justify-between"><div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Monitor size={12}/> Stream Configuration</div>{match.streamUrl && <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Active</span>}</div>
            <div className="grid grid-cols-4 gap-2">
                <button onClick={() => setType('twitch')} className={`flex flex-col items-center justify-center gap-1 py-2 rounded border transition-all ${type === 'twitch' ? 'bg-[#6441a5]/20 border-[#6441a5] text-[#a970ff]' : 'bg-white/5 border-transparent text-gray-500 hover:text-white'}`}><Twitch size={16} /><span className="text-[9px] font-bold uppercase">Twitch</span></button>
                <button onClick={() => setType('youtube')} className={`flex flex-col items-center justify-center gap-1 py-2 rounded border transition-all ${type === 'youtube' ? 'bg-[#FF0000]/20 border-[#FF0000] text-red-500' : 'bg-white/5 border-transparent text-gray-500 hover:text-white'}`}><Youtube size={16} /><span className="text-[9px] font-bold uppercase">YouTube</span></button>
                <button onClick={() => setType('facebook')} className={`flex flex-col items-center justify-center gap-1 py-2 rounded border transition-all ${type === 'facebook' ? 'bg-[#1877F2]/20 border-[#1877F2] text-[#1877F2]' : 'bg-white/5 border-transparent text-gray-500 hover:text-white'}`}><Facebook size={16} /><span className="text-[9px] font-bold uppercase">Facebook</span></button>
                <button onClick={() => setType('custom')} className={`flex flex-col items-center justify-center gap-1 py-2 rounded border transition-all ${type === 'custom' ? 'bg-white/10 border-white text-white' : 'bg-white/5 border-transparent text-gray-500 hover:text-white'}`}><LinkIcon size={16} /><span className="text-[9px] font-bold uppercase">Embed</span></button>
            </div>
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <input type="text" value={val} onChange={(e) => setVal(e.target.value)} placeholder="Enter Stream URL/ID" className="w-full bg-black border border-white/10 text-xs text-white py-3 pl-3 pr-10 rounded font-mono focus:border-purple-500 outline-none transition-colors" />
                    {val && <button onClick={() => setVal('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X size={12}/></button>}
                </div>
                <button onClick={handleSave} className="bg-green-600 hover:bg-green-500 text-white px-4 rounded text-xs font-bold tracking-wide transition-colors flex items-center gap-2"><Save size={14} /> SAVE</button>
            </div>
        </div>
    );
};

const AdminPanel: React.FC<AdminPanelProps> = ({ 
    appState, events, teams, bracketData,
    updateCountdown, updateMatchStatus, updateMatchStream, updateTeamPoints, updateBracketMatch, updateEventBracketMatch, updateEvent, updateTeam, toggleConfetti 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'tournaments' | 'database'>('general');
  
  const [selectedEventId, setSelectedEventId] = useState<string | null>(events[0]?.id || null);
  const [tournamentSubTab, setTournamentSubTab] = useState<'config' | 'info' | 'bracket' | 'matches'>('config');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  const [dateInput, setDateInput] = useState(appState.countdownEnd.slice(0, 16));
  const [pointsInput, setPointsInput] = useState(100);
  const [reasonInput, setReasonInput] = useState('Admin Bonus');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('t1');

  const activeEvent = events.find(e => e.id === selectedEventId);

  // Helper for Tournament Detail Update
  const updateEventDetail = (key: string, value: any) => {
      if (!activeEvent || !updateEvent) return;
      updateEvent(activeEvent.id, {
          details: {
              ...activeEvent.details,
              [key]: value
          }
      });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && updateTeam && editingTeamId) {
        const reader = new FileReader();
        reader.onloadend = () => {
            updateTeam(editingTeamId, { logo: reader.result as string });
        };
        reader.readAsDataURL(file);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[999] bg-black/80 backdrop-blur-md border border-purple-500 text-purple-400 p-3 rounded-full hover:bg-purple-900/50 hover:text-white transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] group"
      >
        <Settings size={24} className="group-hover:rotate-90 transition-transform duration-500" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-lg p-4 animate-in fade-in zoom-in duration-300 font-sans">
      <div className="w-full max-w-7xl h-[90vh] bg-[#05050a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none"></div>

        <div className="bg-[#0a0a0f] p-5 flex justify-between items-center border-b border-white/10 shrink-0 relative z-10">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/50"><Settings className="text-purple-400 animate-spin-slow" size={20} /></div>
                <div><h2 className="text-xl font-bold text-white font-cyber tracking-widest">SYSTEM ADMIN</h2><div className="text-[10px] text-gray-500 font-mono flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> ONLINE // V2.0.4</div></div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        <div className="flex border-b border-white/10 shrink-0 bg-[#0a0a0f] relative z-10 overflow-x-auto">
            {[{ id: 'general', label: 'Dashboard', icon: Activity }, { id: 'tournaments', label: 'Tournament Manager', icon: Trophy }, { id: 'database', label: 'Faction Database', icon: Database }].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-8 py-5 flex items-center gap-3 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-white bg-white/5' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}><tab.icon size={16} />{tab.label}{activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 shadow-[0_0_10px_#a855f7]"></div>}</button>
            ))}
        </div>

        <div className="flex-1 overflow-hidden relative z-10">
            {activeTab === 'general' && (
                <div className="p-8 h-full overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-[#111] border border-white/10 rounded-xl p-6 relative overflow-hidden group"><div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Clock size={100} /></div><h3 className="text-purple-400 font-bold font-cyber text-lg mb-6 flex items-center gap-2">GLOBAL_TIMER</h3><div className="space-y-4"><label className="text-xs text-gray-500 font-bold uppercase tracking-widest">Target Date & Time</label><input type="datetime-local" value={dateInput} onChange={(e) => setDateInput(e.target.value)} className="w-full bg-black border border-white/20 text-white p-4 rounded-lg font-mono focus:border-purple-500 focus:outline-none transition-colors" /><button onClick={() => updateCountdown(new Date(dateInput).toISOString())} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-lg transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] uppercase tracking-widest text-sm">Sync Chronometer</button></div></div>
                    <div className="bg-[#111] border border-white/10 rounded-xl p-6 relative overflow-hidden group"><div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Plus size={100} /></div><h3 className="text-yellow-400 font-bold font-cyber text-lg mb-6 flex items-center gap-2">QUICK_POINTS</h3><div className="space-y-4"><div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 block">Faction</label><select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)} className="w-full bg-black border border-white/20 text-white p-3 rounded-lg font-mono text-sm focus:border-yellow-500 outline-none">{(Object.values(teams) as Team[]).map((t: Team) => (<option key={t.id} value={t.id}>{t.name}</option>))}</select></div><div><label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 block">Amount</label><input type="number" value={pointsInput} onChange={(e) => setPointsInput(parseInt(e.target.value))} className="w-full bg-black border border-white/20 text-white p-3 rounded-lg font-mono text-sm focus:border-yellow-500 outline-none" /></div></div><div><label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 block">Reference</label><input type="text" value={reasonInput} onChange={(e) => setReasonInput(e.target.value)} className="w-full bg-black border border-white/20 text-white p-3 rounded-lg font-mono text-sm focus:border-yellow-500 outline-none" placeholder="e.g. Scavenger Hunt" /></div><button onClick={() => updateTeamPoints(selectedTeamId, pointsInput, reasonInput)} className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] uppercase tracking-widest text-sm flex items-center justify-center gap-2"><Save size={16} /> Transaction Commit</button></div></div>
                    <div className="md:col-span-2 bg-[#111] border border-white/10 rounded-xl p-6 flex items-center justify-between"><div><h3 className="text-pink-400 font-bold font-cyber text-lg mb-1">LIVE FX CONTROL</h3><p className="text-gray-500 text-xs font-mono">Trigger global particle systems.</p></div><button onClick={toggleConfetti} className="bg-pink-900/20 border border-pink-500/50 text-pink-400 hover:bg-pink-500 hover:text-white px-8 py-3 rounded-lg font-bold text-sm transition-all uppercase tracking-widest flex items-center gap-2"><PlayCircle size={18} /> Deploy Confetti</button></div>
                </div>
            )}

            {activeTab === 'tournaments' && (
                <div className="flex h-full">
                    <div className="w-64 bg-[#0c0c12] border-r border-white/10 flex flex-col shrink-0">
                        <div className="p-4 border-b border-white/10 bg-[#111]"><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Events</h3></div>
                        <div className="flex-1 overflow-y-auto">{events.map(evt => (<button key={evt.id} onClick={() => setSelectedEventId(evt.id)} className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-all group ${selectedEventId === evt.id ? 'bg-purple-900/20 border-l-4 border-l-purple-500 pl-3' : 'border-l-4 border-l-transparent'}`}><div className="font-bold text-white group-hover:text-purple-300 transition-colors truncate">{evt.title}</div><div className="text-[10px] text-gray-500 font-mono mt-1">{evt.game}</div></button>))}</div>
                        <button className="p-4 border-t border-white/10 text-center text-xs font-bold text-purple-400 hover:text-white uppercase tracking-widest hover:bg-white/5 transition-colors flex items-center justify-center gap-2"><Plus size={14}/> Create Event</button>
                    </div>

                    <div className="flex-1 flex flex-col h-full bg-[#05050a] relative">
                        {activeEvent ? (
                            <>
                                <div className="h-16 border-b border-white/10 flex items-center px-6 gap-6 bg-[#0a0a0f] shrink-0">
                                    <h2 className="font-cyber text-2xl font-bold text-white truncate max-w-md">{activeEvent.title}</h2>
                                    <div className="h-6 w-px bg-white/10"></div>
                                    <div className="flex gap-2">
                                        {[ { id: 'config', label: 'Setup', icon: Settings }, { id: 'info', label: 'Info', icon: FileText }, { id: 'matches', label: 'Matches', icon: Tv }, { id: 'bracket', label: 'Visual Bracket', icon: LayoutTemplate } ].map(sub => (<button key={sub.id} onClick={() => setTournamentSubTab(sub.id as any)} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${tournamentSubTab === sub.id ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}><sub.icon size={12} /> {sub.label}</button>))}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8">
                                    {tournamentSubTab === 'config' && (
                                        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><ImageIcon size={14}/> Event Visuals</h4>
                                                <div className="flex flex-col md:flex-row gap-6 items-start">
                                                    <div className="w-full md:w-64 aspect-video bg-black rounded-lg border border-white/10 overflow-hidden relative group"><img src={activeEvent.image} alt="Preview" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" /><div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50"><span className="text-[10px] font-mono text-white tracking-widest border border-white px-2 py-1 rounded">PREVIEW</span></div></div>
                                                    <div className="flex-1 w-full space-y-4"><div><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Banner Image URL</label><div className="flex gap-2"><input type="text" value={activeEvent.image} onChange={(e) => updateEvent && updateEvent(activeEvent.id, { image: e.target.value })} className="flex-1 bg-black border border-white/20 text-white p-3 rounded-lg font-mono text-xs focus:border-purple-500 outline-none" placeholder="https://..." /><button className="bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-lg text-white transition-colors"><Upload size={16} /></button></div><p className="text-[10px] text-gray-600 mt-2">Recommended size: 1920x1080. Supports JPG, PNG, WEBP.</p></div></div>
                                                </div>
                                            </div>
                                            <div className="bg-[#111] p-6 rounded-xl border border-white/10 grid grid-cols-2 gap-6"><div className="col-span-2 md:col-span-1"><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Tournament Title</label><input type="text" value={activeEvent.title} onChange={(e) => updateEvent && updateEvent(activeEvent.id, { title: e.target.value })} className="w-full bg-black border border-white/20 text-white p-3 rounded-lg font-bold focus:border-purple-500 outline-none" /></div><div className="col-span-2 md:col-span-1"><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Game Title</label><input type="text" value={activeEvent.game} onChange={(e) => updateEvent && updateEvent(activeEvent.id, { game: e.target.value })} className="w-full bg-black border border-white/20 text-white p-3 rounded-lg font-bold focus:border-purple-500 outline-none" /></div></div>
                                        </div>
                                    )}

                                    {/* INFO TAB (For Brief, Rules, Prize) */}
                                    {tournamentSubTab === 'info' && (
                                        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Registration Status</h4>
                                                <div className="flex gap-4">
                                                    {['Open', 'Pending', 'Closed'].map((s) => (
                                                        <button key={s} onClick={() => updateEventDetail('status', s)} className={`px-6 py-3 rounded border text-xs font-bold uppercase tracking-wider transition-all ${activeEvent.details.status === s ? (s==='Open'?'bg-yellow-900/20 border-yellow-500 text-yellow-500': (s==='Pending' ? 'bg-orange-900/20 border-orange-500 text-orange-500' : 'bg-red-900/20 border-red-500 text-red-500')) : 'bg-black border-white/10 text-gray-500'}`}>
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-6 bg-[#111] p-6 rounded-xl border border-white/10">
                                                <div><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Prize Pool</label><input type="text" value={activeEvent.details.prizePool} onChange={(e) => updateEventDetail('prizePool', e.target.value)} className="w-full bg-black border border-white/20 text-white p-3 rounded-lg font-bold focus:border-purple-500 outline-none" /></div>
                                                <div><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Entry Fee</label><input type="text" value={activeEvent.details.entryFee} onChange={(e) => updateEventDetail('entryFee', e.target.value)} className="w-full bg-black border border-white/20 text-white p-3 rounded-lg font-bold focus:border-purple-500 outline-none" /></div>
                                                <div className="col-span-2"><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Brief / Description</label><textarea value={activeEvent.details.brief} onChange={(e) => updateEventDetail('brief', e.target.value)} className="w-full h-24 bg-black border border-white/20 text-white p-3 rounded-lg text-sm focus:border-purple-500 outline-none resize-none" /></div>
                                                <div className="col-span-2"><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Rules (Comma Separated)</label><input type="text" value={activeEvent.details.rules.join(', ')} onChange={(e) => updateEventDetail('rules', e.target.value.split(',').map((s: string) => s.trim()))} className="w-full bg-black border border-white/20 text-white p-3 rounded-lg text-sm focus:border-purple-500 outline-none" /></div>
                                                <div className="col-span-2 pt-4 border-t border-white/5">
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Calendar size={12}/> Event Schedule (Countdown Target)</label>
                                                    <div className="grid grid-cols-4 gap-4">
                                                        {['day', 'hour', 'min', 'sec'].map((k) => (
                                                            <div key={k}>
                                                                <span className="text-[9px] uppercase text-gray-600 font-bold block mb-1">{k}</span>
                                                                <input type="text" value={activeEvent.details.schedule[k as keyof typeof activeEvent.details.schedule]} onChange={(e) => updateEventDetail('schedule', { ...activeEvent.details.schedule, [k]: e.target.value })} className="w-full bg-black border border-white/20 text-white p-2 rounded font-mono text-center focus:border-purple-500 outline-none" maxLength={2} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* BRACKET TAB (Per Event) */}
                                    {tournamentSubTab === 'bracket' && (
                                        <div className="animate-in fade-in slide-in-from-bottom-2">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {activeEvent.bracket.map((match) => (
                                                    <div key={match.id} className="bg-[#111] p-5 rounded-xl border border-white/10 hover:border-purple-500/50 transition-colors group relative overflow-hidden">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                        <div className="flex justify-between items-center mb-4">
                                                            <span className="text-[10px] font-mono text-gray-500 uppercase bg-black/50 px-2 py-1 rounded">ID: {match.id}</span>
                                                            <select value={match.status} onChange={(e) => updateEventBracketMatch(activeEvent.id, match.id, match.p1.score, match.p2.score, e.target.value)} className="bg-black text-[10px] text-white font-bold border border-white/20 rounded px-2 py-1 outline-none uppercase tracking-wider focus:border-purple-500">
                                                                <option value="scheduled">Scheduled</option><option value="live">Live</option><option value="finished">Finished</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <div className={`flex items-center justify-between p-2 rounded ${match.p1.isWinner ? 'bg-green-900/10 border border-green-500/30' : 'bg-white/5 border border-transparent'}`}>
                                                                <span className={`text-sm font-bold ${match.p1.isWinner ? 'text-green-400' : 'text-gray-300'}`}>{teams[match.p1.id]?.name || match.p1.id}</span>
                                                                <input type="number" value={match.p1.score ?? ''} placeholder="-" onChange={(e) => updateEventBracketMatch(activeEvent.id, match.id, parseInt(e.target.value) || 0, match.p2.score, match.status)} className="w-10 bg-black border border-white/20 text-center text-white rounded p-1 text-xs font-mono focus:border-purple-500 outline-none" />
                                                            </div>
                                                            <div className={`flex items-center justify-between p-2 rounded ${match.p2.isWinner ? 'bg-green-900/10 border border-green-500/30' : 'bg-white/5 border border-transparent'}`}>
                                                                <span className={`text-sm font-bold ${match.p2.isWinner ? 'text-green-400' : 'text-gray-300'}`}>{teams[match.p2.id]?.name || match.p2.id}</span>
                                                                <input type="number" value={match.p2.score ?? ''} placeholder="-" onChange={(e) => updateEventBracketMatch(activeEvent.id, match.id, match.p1.score, parseInt(e.target.value) || 0, match.status)} className="w-10 bg-black border border-white/20 text-center text-white rounded p-1 text-xs font-mono focus:border-purple-500 outline-none" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {activeEvent.bracket.length === 0 && <div className="text-gray-500 text-sm p-4">No bracket data initialized for this event.</div>}
                                            </div>
                                        </div>
                                    )}

                                    {tournamentSubTab === 'matches' && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                            {activeEvent.matches.map(m => (
                                                <div key={m.id} className="bg-[#111] p-5 rounded-xl border border-white/10 flex flex-col gap-4 group hover:border-white/20 transition-colors">
                                                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                                        <div className="flex items-center gap-3"><div className="bg-white/5 px-2 py-1 rounded text-[10px] font-mono font-bold text-gray-400">MATCH {m.id}</div><span className="text-xs text-gray-500 font-bold uppercase">Round {m.round}</span></div>
                                                        <div className="flex gap-2">{['scheduled', 'live', 'completed'].map(status => (<button key={status} onClick={() => updateMatchStatus(activeEvent.id, m.id, status as Match['status'])} className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors border ${m.status === status ? (status === 'live' ? 'bg-red-900/30 border-red-500 text-red-400' : (status === 'completed' ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-gray-800 border-gray-600 text-white')) : 'bg-transparent border-transparent text-gray-600 hover:text-gray-400'}`}>{status}</button>))}</div>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4"><div className="flex-1 bg-black/40 p-3 rounded-lg border border-white/5 flex justify-between items-center"><span className="font-bold text-white text-sm">{teams[m.teamA]?.name || m.teamA}</span><span className="text-xs font-mono text-gray-500">TEAM A</span></div><div className="text-gray-600 font-black font-cyber text-xl">VS</div><div className="flex-1 bg-black/40 p-3 rounded-lg border border-white/5 flex justify-between items-center"><span className="text-xs font-mono text-gray-500">TEAM B</span><span className="font-bold text-white text-sm">{teams[m.teamB]?.name || m.teamB}</span></div></div>
                                                    <StreamEditor match={m} eventId={activeEvent.id} onSave={updateMatchStream} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-600 font-mono text-xs uppercase tracking-widest">Select an Event to Configure</div>
                        )}
                    </div>
                </div>
            )}

            {/* --- DATABASE TAB --- */}
            {activeTab === 'database' && (
                <div className="flex h-full">
                    {/* ... (Existing Database logic preserved) ... */}
                    <div className="w-72 border-r border-white/10 bg-[#0c0c12] flex flex-col"><div className="p-4 border-b border-white/10 bg-[#111]"><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Factions Registry</h3></div><div className="flex-1 overflow-y-auto">{Object.values(teams).map((team: Team) => (<button key={team.id} onClick={() => setEditingTeamId(team.id)} className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-all flex items-center gap-3 ${editingTeamId === team.id ? 'bg-white/10 border-l-4 border-l-purple-500 pl-3' : 'border-l-4 border-l-transparent'}`}><div className="w-8 h-8 rounded bg-black flex items-center justify-center text-lg shadow-inner overflow-hidden">{team.logo.startsWith('http') || team.logo.startsWith('data:') ? (<img src={team.logo} className="w-full h-full object-cover" alt="Logo" />) : (team.logo)}</div><div className="flex-1 min-w-0"><div className="text-sm font-bold text-white truncate">{team.name}</div><div className="text-[10px] text-gray-500 font-mono">{team.id.toUpperCase()}</div></div></button>))}</div></div>
                    <div className="flex-1 bg-[#05050a] p-8 overflow-y-auto">
                        {editingTeamId && teams[editingTeamId] ? (
                            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-6 pb-6 border-b border-white/10">
                                    <div className="w-24 h-24 rounded-2xl bg-black border border-white/10 flex items-center justify-center text-6xl shadow-[0_0_30px_rgba(255,255,255,0.05)] overflow-hidden relative group">{teams[editingTeamId].logo.startsWith('http') || teams[editingTeamId].logo.startsWith('data:') ? (<img src={teams[editingTeamId].logo} className="w-full h-full object-cover" alt="Logo" />) : (teams[editingTeamId].logo)}<label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"><Upload size={24} className="text-white" /><input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} /></label></div>
                                    <div><h2 className="text-3xl font-black font-cyber text-white mb-2">{teams[editingTeamId].name}</h2><div className="flex gap-3"><span className="bg-white/10 px-2 py-1 rounded text-[10px] font-mono text-gray-400 uppercase tracking-widest">ID: {editingTeamId}</span><span className="bg-white/10 px-2 py-1 rounded text-[10px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">Color: <span className="w-3 h-3 rounded-full" style={{backgroundColor: teams[editingTeamId].color}}></span></span></div></div>
                                </div>
                                <div className="grid grid-cols-2 gap-6"><div className="col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Faction Name</label><input type="text" value={teams[editingTeamId].name} onChange={(e) => updateTeam && updateTeam(editingTeamId, { name: e.target.value })} className="w-full bg-[#111] border border-white/20 text-white p-4 rounded-lg font-bold focus:border-purple-500 outline-none transition-colors" /></div><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Primary Color (Hex)</label><div className="flex gap-2"><input type="color" value={teams[editingTeamId].color} onChange={(e) => updateTeam && updateTeam(editingTeamId, { color: e.target.value })} className="h-12 w-12 rounded bg-transparent border-0 cursor-pointer" /><input type="text" value={teams[editingTeamId].color} onChange={(e) => updateTeam && updateTeam(editingTeamId, { color: e.target.value })} className="flex-1 bg-[#111] border border-white/20 text-white px-4 rounded-lg font-mono text-sm focus:border-purple-500 outline-none uppercase" /></div></div><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Logo (Emoji/Char)</label><input type="text" value={teams[editingTeamId].logo} onChange={(e) => updateTeam && updateTeam(editingTeamId, { logo: e.target.value })} className="w-full bg-[#111] border border-white/20 text-white p-3 rounded-lg text-center text-2xl focus:border-purple-500 outline-none" placeholder="Paste URL or Emoji" /></div><div className="col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Lore Description</label><textarea value={teams[editingTeamId].description} onChange={(e) => updateTeam && updateTeam(editingTeamId, { description: e.target.value })} className="w-full h-32 bg-[#111] border border-white/20 text-white p-4 rounded-lg text-sm leading-relaxed focus:border-purple-500 outline-none resize-none" /></div></div>
                            </div>
                        ) : (<div className="h-full flex flex-col items-center justify-center text-gray-600"><Database size={48} className="mb-4 opacity-50" /><span className="text-xs font-bold uppercase tracking-widest">Select a Faction to Edit</span></div>)}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

import React, { useState } from 'react';
import { Team, UserProfile, AppState } from '../types';
import { Menu, X, Gamepad2, Trophy, Scan, User } from 'lucide-react';

interface DashboardLayoutProps {
  currentTeam: Team;
  userProfile: UserProfile;
  currentView: AppState['currentView'];
  onNavigate: (view: AppState['currentView']) => void;
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ currentTeam, userProfile, currentView, onNavigate, children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'games', label: 'GAMES', icon: Gamepad2 },
    { id: 'leaderboard', label: 'STANDINGS', icon: Trophy },
    { id: 'scanner', label: 'QR SCANNER', icon: Scan },
  ] as const;

  const handleNav = (view: AppState['currentView']) => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 h-20 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-gray-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="text-3xl animate-pulse" style={{ color: currentTeam.color }}>
                {/* Simple Logo SVG Placeholder */}
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                </svg>
            </div>
            <div className="font-bold tracking-wider">
                ITE <span style={{ color: currentTeam.color }}>VERSE</span>
            </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 bg-[#111] p-1 rounded-full border border-gray-800">
            {navItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${currentView === item.id ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                >
                    <item.icon size={14} /> {item.label}
                </button>
            ))}
        </div>

        {/* User Profile / Mobile Menu Toggle */}
        <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-3 text-right">
                <div>
                    <div className="text-xs font-bold">{userProfile.username}</div>
                    <div className="text-[10px] text-gray-500" style={{ color: currentTeam.color }}>{currentTeam.name}</div>
                </div>
                <div className="w-8 h-8 rounded bg-gray-800 overflow-hidden border border-gray-700">
                    <img src={userProfile.avatar} className="w-full h-full object-cover" />
                </div>
             </div>

             <button 
                onClick={() => setIsMenuOpen(true)}
                className="md:hidden p-2 text-white hover:bg-gray-800 rounded"
             >
                <Menu />
             </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col p-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-12">
                <span className="font-cyber text-xl">MENU</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 border border-white rounded-full hover:bg-white hover:text-black transition-colors">
                    <X size={20} />
                </button>
            </div>
            
            <nav className="flex flex-col gap-4">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => handleNav(item.id)}
                        className="flex items-center gap-4 p-4 border border-gray-800 bg-[#111] hover:bg-[#222] text-left transition-colors group"
                        style={currentView === item.id ? { borderColor: currentTeam.color } : {}}
                    >
                        <item.icon className={`transition-colors ${currentView === item.id ? 'text-[var(--team-color)]' : 'text-gray-500 group-hover:text-white'}`} style={{ '--team-color': currentTeam.color } as React.CSSProperties} />
                        <span className="font-bold text-lg tracking-wider">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="mt-auto border-t border-gray-800 pt-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded bg-gray-800 overflow-hidden">
                        <img src={userProfile.avatar} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <div className="font-bold">{userProfile.username}</div>
                        <div className="text-xs text-gray-500">Logged in as {currentTeam.name} Member</div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pt-20 relative">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
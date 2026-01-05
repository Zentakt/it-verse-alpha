import React, { useState } from 'react';
import { LiveStream } from '../types';
import EnhancedStreamView from './EnhancedStreamView';
import { Play } from 'lucide-react';

/**
 * StreamViewDemo Component
 * 
 * Demonstrates the EnhancedStreamView component with example live streams
 * Showcases responsive design, 3D scoreboard, and GSAP animations
 */

const DEMO_STREAMS: LiveStream[] = [
    {
        id: 'stream-1',
        title: 'Valorant Pro League Finals - Team Alpha vs Team Omega',
        description: 'The championship deciding match between the two best teams in the region. Expected to be an intense battle with high-level gameplay.',
        embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnail_url: 'https://images.unsplash.com/photo-1538481143235-b716cc223eaf?w=800&h=450&fit=crop',
        thumbnail_mode: 'upload',
        game_category: 'Valorant',
        status: 'live',
        placement: 'hero',
        tournament_id: 'pro-league-2026',
        team1_name: 'Team Alpha',
        team1_logo: '🔴',
        team1_score: 13,
        team2_name: 'Team Omega',
        team2_logo: '🔵',
        team2_score: 11,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'stream-2',
        title: 'CS2 Championship Qualifier - Dragon Hunters vs Phoenix Rising',
        description: 'An intense Counter-Strike 2 qualifier match. The stakes are high as both teams fight for a spot in the grand championship.',
        embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnail_url: 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=800&h=450&fit=crop',
        thumbnail_mode: 'upload',
        game_category: 'CS2',
        status: 'scheduled',
        placement: 'recommended',
        tournament_id: 'cs2-qualifier-2026',
        team1_name: 'Dragon Hunters',
        team1_logo: '🐉',
        team1_score: 0,
        team2_name: 'Phoenix Rising',
        team2_logo: '🔥',
        team2_score: 0,
        created_at: new Date(Date.now() + 3600000).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'stream-3',
        title: 'League of Legends Regional Finals - Shadow Syndicate vs Eclipse Esports',
        description: 'The ultimate test of strategy and mechanics in the League of Legends Regional Finals.',
        embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnail_url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=450&fit=crop',
        thumbnail_mode: 'upload',
        game_category: 'League of Legends',
        status: 'ended',
        placement: 'previous',
        tournament_id: 'lol-regional-2026',
        team1_name: 'Shadow Syndicate',
        team1_logo: '🌑',
        team1_score: 3,
        team2_name: 'Eclipse Esports',
        team2_logo: '⭐',
        team2_score: 1,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
];

const StreamViewDemo: React.FC = () => {
    const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);

    return (
        <div className="min-h-screen bg-[#0e0e10] text-white pt-20 pb-20">
            {/* Header */}
            <div className="max-w-6xl mx-auto px-4 mb-12">
                <h1 className="text-5xl font-black font-cyber mb-2 text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text">
                    Enhanced Stream View Demo
                </h1>
                <p className="text-gray-400 text-lg">
                    Explore our award-worthy stream interface with 3D scoreboard, advanced animations, and responsive design
                </p>
            </div>

            {/* Demo Streams Grid */}
            <div className="max-w-6xl mx-auto px-4">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <span className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded"></span>
                    Featured Streams
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {DEMO_STREAMS.map((stream) => (
                        <div
                            key={stream.id}
                            onClick={() => setSelectedStream(stream)}
                            className="group cursor-pointer relative overflow-hidden rounded-xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]"
                        >
                            {/* Thumbnail */}
                            <div className="relative aspect-video overflow-hidden bg-black/50">
                                {stream.thumbnail_url && (
                                    <img
                                        src={stream.thumbnail_url}
                                        alt={stream.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                )}

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.6)]">
                                        <Play size={32} fill="white" className="text-white ml-1" />
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="absolute top-3 left-3">
                                    {stream.status === 'live' && (
                                        <div className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                            LIVE
                                        </div>
                                    )}
                                    {stream.status === 'scheduled' && (
                                        <div className="flex items-center gap-1.5 bg-yellow-600/80 text-white text-xs font-bold px-2 py-1 rounded">
                                            ⏰ SCHEDULED
                                        </div>
                                    )}
                                    {stream.status === 'ended' && (
                                        <div className="flex items-center gap-1.5 bg-gray-600/80 text-white text-xs font-bold px-2 py-1 rounded">
                                            ✓ ENDED
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 bg-gradient-to-br from-black/50 to-black/80 border-t border-white/5">
                                <h3 className="font-bold text-white line-clamp-2 mb-2 group-hover:text-purple-400 transition-colors">
                                    {stream.title}
                                </h3>

                                {/* Teams Display */}
                                {stream.team1_name && stream.team2_name && (
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{stream.team1_logo || '🏆'}</span>
                                            <span className="text-xs font-mono text-gray-400 truncate">{stream.team1_name}</span>
                                        </div>
                                        <div className="text-xs font-bold text-gray-500">
                                            {stream.team1_score} : {stream.team2_score}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-gray-400 truncate text-right">{stream.team2_name}</span>
                                            <span className="text-xl">{stream.team2_logo || '🏆'}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Game & Game Category */}
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-gray-500 uppercase tracking-wider">{stream.game_category}</span>
                                    <span className="text-purple-400 font-bold uppercase">{stream.placement}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Features Section */}
                <div className="mt-20">
                    <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                        <span className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-blue-500 rounded"></span>
                        Key Features
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: '🎬',
                                title: '3D Scoreboard',
                                description: 'Interactive 3D visualization powered by Three.js with rotating score boxes and glowing effects',
                            },
                            {
                                icon: '✨',
                                title: 'Advanced Animations',
                                description: 'Smooth GSAP animations for entrance, hover, and interactive effects throughout the interface',
                            },
                            {
                                icon: '📱',
                                title: 'Responsive Design',
                                description: 'Perfect on mobile, tablet, and desktop with adaptive layouts and flexible typography',
                            },
                            {
                                icon: '🎨',
                                title: 'Premium Visuals',
                                description: 'Modern gradient color schemes, glitch effects, and neon accents for a futuristic feel',
                            },
                            {
                                icon: '🏆',
                                title: 'Team Branding',
                                description: 'Dynamic team logos (emoji or URLs) with color-coded cards for Team A and Team B',
                            },
                            {
                                icon: '⚡',
                                title: 'Performance Optimized',
                                description: 'GPU-accelerated animations, proper resource cleanup, and lazy-loaded effects',
                            },
                        ].map((feature, idx) => (
                            <div
                                key={idx}
                                className="group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-white/5 to-white/2 border border-white/10 hover:border-purple-500/30 transition-all duration-300 hover:bg-gradient-to-br hover:from-purple-900/20 hover:to-cyan-900/20"
                            >
                                <div className="text-4xl mb-3">{feature.icon}</div>
                                <h3 className="font-bold text-lg mb-2 text-white">{feature.title}</h3>
                                <p className="text-sm text-gray-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-20 p-8 rounded-xl border border-white/10 bg-gradient-to-br from-purple-900/20 to-cyan-900/20">
                    <h3 className="text-xl font-bold mb-4">How to Use</h3>
                    <ol className="space-y-3 text-gray-300">
                        <li><strong>1.</strong> Click any stream card above to open the Enhanced Stream View</li>
                        <li><strong>2.</strong> Experience the smooth entrance animations and 3D scoreboard</li>
                        <li><strong>3.</strong> Hover over team cards to see interactive glitch effects</li>
                        <li><strong>4.</strong> Resize your browser to see responsive design in action</li>
                        <li><strong>5.</strong> Notice the particle effects on live matches and smooth transitions</li>
                    </ol>
                </div>
            </div>

            {/* Enhanced Stream View Modal */}
            {selectedStream && (
                <EnhancedStreamView
                    stream={selectedStream}
                    onClose={() => setSelectedStream(null)}
                />
            )}
        </div>
    );
};

export default StreamViewDemo;
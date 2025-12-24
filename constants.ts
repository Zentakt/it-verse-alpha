

import { GameEvent, Team, UserProfile } from './types';

// Teams with detailed breakdown and themes
export const TEAMS: Record<string, Team> = {
  't1': { 
    id: 't1', 
    name: 'Metamorphic Python', 
    logo: '🐍', 
    seed: 1,
    description: 'Script Masters',
    color: '#eab308', // Yellow
    breakdown: [
      { source: 'Mobile Legends (3rd)', points: 100 },
      { source: 'Chess (Runner-up)', points: 150 },
      { source: 'Quiz Bee (Win)', points: 200 }
    ]
  },
  't2': { 
    id: 't2', 
    name: 'Exuberant Ajax', 
    logo: '⚡', 
    seed: 2,
    description: 'System Operators',
    color: '#06b6d4', // Cyan
    breakdown: [
      { source: 'Valorant (3rd)', points: 100 },
      { source: 'QR Hunt', points: 500 }
    ]
  },
  't3': { 
    id: 't3', 
    name: 'Java The Explorer', 
    logo: '☕', 
    seed: 3,
    description: 'Backend Giants',
    color: '#00f0b5', // Jade Green
    breakdown: [
      { source: 'Mobile Legends (Win)', points: 300 },
      { source: 'Chess (Win)', points: 200 }
    ]
  },
  't4': { 
    id: 't4', 
    name: 'Magnificent Ruby', 
    logo: '💎', 
    seed: 4,
    description: 'Code Gemstones',
    color: '#ef4444', // Red
    breakdown: [
      { source: 'Valorant (Win)', points: 300 },
      { source: 'Call of Duty (Win)', points: 250 }
    ]
  },
  't5': { id: 't5', name: 'C++ Crusaders', logo: '🛡️', seed: 5, description: 'Memory Managers', color: '#3b82f6', breakdown: [] },
  't6': { id: 't6', name: 'Rust Aceans', logo: '🦀', seed: 6, description: 'Safety First', color: '#f43f5e', breakdown: [] },
  't7': { id: 't7', name: 'Go Gophers', logo: '🐹', seed: 7, description: 'Concurrent Forces', color: '#22c55e', breakdown: [] },
  't8': { id: 't8', name: 'Swift Strikers', logo: '🕊️', seed: 8, description: 'Apple Orchard', color: '#ec4899', breakdown: [] },
};

// Initial Events Data
export const INITIAL_EVENTS: GameEvent[] = [
  {
    id: 'evt1',
    title: 'Code Brawl 2025',
    game: 'Valorant',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80',
    description: 'The ultimate tactical shooter showdown.',
    bracketType: 'single',
    matches: [
      { id: 'm1', teamA: 't1', teamB: 't8', scoreA: 13, scoreB: 5, status: 'completed', startTime: '2025-10-25T10:00:00Z', round: 1, winnerId: 't1' },
      { id: 'm3', teamA: 't3', teamB: 't6', scoreA: 12, scoreB: 12, status: 'live', startTime: '2025-10-25T12:00:00Z', streamUrl: 'https://www.youtube.com/embed/XSXEaikz0Bc?si=77p1WxwsddnQinOj', round: 1 },
    ]
  },
  {
    id: 'evt2',
    title: 'Cyber Arena',
    game: 'Tekken 8',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
    description: 'King of the Iron Fist Tournament.',
    bracketType: 'double',
    matches: [
      { id: 'm5', teamA: 't1', teamB: 't2', scoreA: 3, scoreB: 2, status: 'live', startTime: '2025-10-26T15:00:00Z', streamUrl: 'https://twitch.tv/cutespiders_', round: 1 },
    ]
  },
  {
    id: 'evt3',
    title: 'Nexus Blitz',
    game: 'League of Legends',
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80',
    description: 'Summoners Rift awaits.',
    bracketType: 'single',
    matches: []
  },
  {
      id: 'evt4',
      title: 'Checkmate',
      game: 'Chess.com',
      image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&q=80',
      description: 'Strategic domination.',
      bracketType: 'single',
      matches: []
  }
];

export const INITIAL_PROFILE: UserProfile = {
  username: 'Guest_001',
  avatar: 'https://picsum.photos/200/200?random=4',
  theme: 'cyber',
  badges: ['Early Bird', 'Viewer']
};

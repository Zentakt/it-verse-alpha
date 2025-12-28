
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

export const INITIAL_PROFILE: UserProfile = {
  username: 'Guest_001',
  avatar: 'https://picsum.photos/200/200?random=4',
  theme: 'cyber',
  badges: ['Early Bird', 'Viewer']
};

export const INITIAL_BRACKET_DATA: any[] = []; // Deprecated, moved inside events

// Initial Events Data
export const INITIAL_EVENTS: GameEvent[] = [
  {
    id: 'mlbb',
    title: 'Exuberant Invitational',
    game: 'Mobile Legends: Bang Bang',
    shortName: 'MLBB',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&q=80',
    description: 'The premier proving ground for mobile operatives.',
    bracketType: 'single',
    matches: [
       { id: 'm1', teamA: 't1', teamB: 't3', scoreA: 1, scoreB: 2, status: 'completed', startTime: '2025-10-25T10:00:00Z', round: 1, winnerId: 't3' },
    ],
    details: {
        status: 'Open',
        prizePool: '₳ 1,250,000',
        entryFee: '500 PTS',
        format: '5v5',
        brief: 'Operatives will compete in a 5v5 bracket for the championship title and a share of the massive prize pool.',
        rules: ['Mode: 5v5 Draft Pick', 'Skin restrictions apply', 'Pause limit: 3 per team'],
        schedule: { day: '12', hour: '14', min: '03', sec: '48' }
    },
    bracket: [
        { id: 'r1_m1', round: 0, nextMatchId: 'r2_m1', status: 'finished', p1: { id: 't1', score: 1 }, p2: { id: 't3', score: 2, isWinner: true } },
        { id: 'r1_m2', round: 0, nextMatchId: 'r2_m1', status: 'scheduled', p1: { id: 't5', score: null }, p2: { id: 't6', score: null } },
        { id: 'r2_m1', round: 1, status: 'scheduled', p1: { id: 't3', score: null }, p2: { id: 'tbd', score: null } },
    ]
  },
  {
    id: 'val',
    title: 'Protocol Alpha',
    game: 'Valorant',
    shortName: 'VALORANT',
    image: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=1600&q=80',
    description: 'Tactical shooter showdown.',
    bracketType: 'single',
    matches: [
        { id: 'v1', teamA: 't2', teamB: 't4', scoreA: 13, scoreB: 11, status: 'live', startTime: '2025-10-26T15:00:00Z', streamUrl: 'https://www.youtube.com/embed/XSXEaikz0Bc', round: 1 },
    ],
    details: {
        status: 'Pending',
        prizePool: '₳ 2,000,000',
        entryFee: '800 PTS',
        format: '5v5',
        brief: 'Precision gunplay meets unique agent abilities.',
        rules: ['Map Pool: Ascent, Bind, Haven', 'Standard Competitive Rules'],
        schedule: { day: '05', hour: '02', min: '10', sec: '00' }
    },
    bracket: [
        { id: 'v_r1_1', round: 0, nextMatchId: 'v_r2_1', status: 'live', p1: { id: 't2', score: 13 }, p2: { id: 't4', score: 11 } },
        { id: 'v_r1_2', round: 0, nextMatchId: 'v_r2_1', status: 'scheduled', p1: { id: 't7', score: null }, p2: { id: 't8', score: null } },
        { id: 'v_r2_1', round: 1, status: 'scheduled', p1: { id: 'tbd', score: null }, p2: { id: 'tbd', score: null } },
    ]
  },
  {
    id: 'tekken',
    title: 'Iron Fist Arena',
    game: 'Tekken 8',
    shortName: 'TEKKEN',
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1600&q=80',
    description: '1v1 Combat Superiority.',
    bracketType: 'double',
    matches: [],
    details: {
        status: 'Closed',
        prizePool: '₳ 500,000',
        entryFee: '200 PTS',
        format: '1v1',
        brief: 'The King of Iron Fist Tournament.',
        rules: ['Best of 3', 'Double Elimination', 'Console Only'],
        schedule: { day: '00', hour: '22', min: '15', sec: '30' }
    },
    bracket: [
        { id: 't_r1_1', round: 0, nextMatchId: 't_r2_1', status: 'scheduled', p1: { id: 't1', score: null }, p2: { id: 't2', score: null } },
    ]
  },
  {
      id: 'chess',
      title: 'Grandmaster Gambit',
      game: 'Chess.com',
      shortName: 'CHESS',
      image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=1600&q=80',
      description: 'Strategic domination.',
      bracketType: 'single',
      matches: [],
      details: {
        status: 'Open',
        prizePool: '₳ 100,000',
        entryFee: 'FREE',
        format: '1v1',
        brief: 'Checkmate your opponents in rapid fire blitz games.',
        rules: ['10 min rapid', 'Touch move'],
        schedule: { day: '01', hour: '00', min: '45', sec: '00' }
    },
    bracket: [
        { id: 'c_r1_1', round: 0, nextMatchId: 'c_r2_1', status: 'scheduled', p1: { id: 't5', score: null }, p2: { id: 't8', score: null } },
    ]
  }
];

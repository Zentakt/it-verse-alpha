
export interface Team {
  id: string;
  name: string;
  logo: string; // URL or emoji for demo
  seed: number;
  description: string;
  color: string; // Hex for UI theming
  breakdown: { source: string; points: number }[];
}

export interface Match {
  id: string;
  teamA: string; // Team ID
  teamB: string; // Team ID
  scoreA: number;
  scoreB: number;
  status: 'scheduled' | 'live' | 'completed';
  startTime: string; // ISO String
  streamUrl?: string; // Embed URL
  round: number;
  winnerId?: string;
}

export interface BracketMatch {
    id: string;
    round: number; 
    p1: { id: string; score: number | null; isWinner?: boolean };
    p2: { id: string; score: number | null; isWinner?: boolean };
    nextMatchId?: string;
    status: 'scheduled' | 'live' | 'finished';
}

export interface TournamentDetails {
    status: 'Open' | 'Pending' | 'Closed';
    prizePool: string;
    entryFee: string;
    format: string;
    brief: string;
    rules: string[];
    schedule: { day: string; hour: string; min: string; sec: string };
}

export interface GameEvent {
  id: string;
  title: string;
  image: string; // Thumbnail/Banner
  game: string; // e.g., "Valorant"
  shortName: string; // e.g. "VAL"
  description: string;
  matches: Match[]; // For the "Live Games" list
  bracket: BracketMatch[]; // For the Visual Bracket
  bracketType: 'single' | 'double' | 'round-robin';
  details: TournamentDetails;
}

export interface UserProfile {
  username: string;
  avatar: string;
  theme: 'cyber' | 'retro' | 'dark';
  badges: string[];
}

export interface Challenge {
    id: string;
    title: string;
    description: string;
    question: string;
    answer: string;
    points: number;
}

export interface AppState {
  countdownEnd: string; // ISO String
  isTorchLit: boolean;
  selectedTeamId: string | null;
  currentView: 'games' | 'leaderboard' | 'scanner' | 'tournaments' | 'login';
}

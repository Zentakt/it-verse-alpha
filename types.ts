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

export interface GameEvent {
  id: string;
  title: string;
  image: string; // Thumbnail
  game: string; // e.g., "Valorant"
  description: string;
  matches: Match[];
  bracketType: 'single' | 'double' | 'round-robin';
}

export interface UserProfile {
  username: string;
  avatar: string;
  theme: 'cyber' | 'retro' | 'dark';
  badges: string[];
}

export interface AppState {
  countdownEnd: string; // ISO String
  isTorchLit: boolean;
  selectedTeamId: string | null;
  currentView: 'games' | 'leaderboard' | 'scanner';
}
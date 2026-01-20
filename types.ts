
export interface TeamBreakdownItem {
  source: string;
  points: number;
  comment?: string;
  updatedBy?: string;
  createdAt?: string;
}

export interface Team {
  id: string;
  name: string;
  logo: string; // URL or emoji for demo
  seed: number;
  description: string;
  color: string; // Hex for UI theming
  breakdown: TeamBreakdownItem[];
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
  teamALogo?: string;
  teamBLogo?: string;
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
  gameLogo?: string;
  banner?: string;
  startDate?: string;
  format?: string;
  entryFee?: number;
  countdownEnd?: string;
  globalSeed?: number;
  modeWins?: number;
  modeLosses?: number;
  matchHistorySynced?: boolean;
  statusRegistration?: string;
  statusConfirmation?: string;
  statusSeeding?: string;
  rulesText?: string;
  availableSlots?: number;
  confirmedSlots?: number;
  teamRecord?: {
    wins: number;
    losses: number;
    draws?: number;
    note?: string;
  };
  organizer?: {
    name: string;
    email: string;
    discord?: string;
    phone?: string;
  };
}

export interface UserProfile {
  username: string;
  avatar: string;
  theme: 'cyber' | 'retro' | 'dark';
  badges: string[];
  isAdmin: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  question: string;
  answer: string;
  points: number;
  gameType?: 'none' | 'sequence' | 'memory' | 'cipher' | 'quiz' | '4pics' | 'wordle' | 'visual_count' | 'bonus';
  gameConfig?: any; // For custom sequences or card counts
}

export interface LiveStream {
  id: string;
  title: string;
  description?: string;
  embed_url: string;
  thumbnail_url?: string;
  thumbnail_mode: 'upload' | 'embed';
  game_category?: string;
  tournament_id?: string;
  status: 'scheduled' | 'live' | 'ended';
  placement: string[]; // Array of placements: can include 'hero', 'recommended', 'previous'
  starts_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
  // Scoreboard data
  team1_id?: string;
  team1_name?: string;
  team1_logo?: string;
  team1_score?: number;
  team2_id?: string;
  team2_name?: string;
  team2_logo?: string;
  team2_score?: number;
}

export interface AppState {
  countdownEnd: string; // ISO String
  isTorchLit: boolean;
  isTorchAutoLit: boolean; // Tracks if torch auto-lit from countdown (prevents animation repeat)
  selectedTeamId: string | null;
  currentView: 'games' | 'leaderboard' | 'scanner' | 'tournaments' | 'login';
}

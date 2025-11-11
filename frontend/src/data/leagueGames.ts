// Central source of league-related game lists so UI areas stay in sync
export const LEAGUE_GAMES = [
  'Super Smash Bros. Ultimate',
  'Street Fighter 6',
  'Rocket League',
  // keep other league topics here if you want them shown in the sidebar
  'League of Legends',
  'Counter‑Strike 2',
  'Dota 2',
]

// The three recommended games shown in the calendar quick-add area
export const LEAGUE_RECOMMENDED = LEAGUE_GAMES.slice(0, 3)

import { CapabilityCard } from './CapabilityCard.js';

import { getJson } from '../api/client.js';

type Ranking = { teamName: string; totalPoints: number; rank: number };

async function loadLeaderboard() {
  const response = await getJson<{ leaderboard: Ranking[] }>('/api/leaderboard');
  return response.leaderboard;
}

export default function Leaderboard() {
  return <CapabilityCard
    title="Leaderboard"
    description="Compare team point totals."
    emptyLabel="leaderboard rankings"
    load={loadLeaderboard}
    renderItem={(ranking) => <><strong>#{ranking.rank} {ranking.teamName}</strong> — {ranking.totalPoints} points</>}
  />;
}

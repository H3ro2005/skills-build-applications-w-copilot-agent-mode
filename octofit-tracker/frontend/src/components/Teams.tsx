import { CapabilityCard } from './CapabilityCard.js';

import { getJson } from '../api/client.js';

type Team = { name: string; mascot?: string; members?: string[] };

async function loadTeams() {
  const response = await getJson<{ teams: Team[] }>('/api/teams');
  return response.teams;
}

export default function Teams() {
  return <CapabilityCard
    title="Teams"
    description="Manage teams and members."
    emptyMessage="No teams available yet."
    load={loadTeams}
    renderItem={(team) => <><strong>{team.name}</strong>{team.mascot && ` (${team.mascot})`}<span className="d-block">Members: {team.members?.length ?? 0}</span></>}
  />;
}

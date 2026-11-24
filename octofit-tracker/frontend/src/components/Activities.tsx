import { CapabilityCard } from './CapabilityCard.js';

import { getJson } from '../api/client.js';

type Activity = { type: string; minutes: number; points: number };

async function loadActivities() {
  const response = await getJson<{ activities: Activity[] }>('/api/activities');
  return response.activities;
}

export default function Activities() {
  return <CapabilityCard
    title="Activities"
    description="Track student activity minutes and points."
    emptyMessage="No activities available yet."
    load={loadActivities}
    renderItem={(activity) => <><strong>{activity.type}</strong> — {activity.minutes} minutes, {activity.points} points</>}
  />;
}

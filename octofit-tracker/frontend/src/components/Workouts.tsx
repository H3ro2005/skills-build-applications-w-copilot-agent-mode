import { CapabilityCard } from './CapabilityCard.js';

import { getJson } from '../api/client.js';

type WorkoutSuggestion = { title: string; reason: string };

async function loadSuggestions() {
  const response = await getJson<{ suggestions: WorkoutSuggestion[] }>(
    `/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`,
  );
  return response.suggestions;
}

export default function Workouts() {
  return <CapabilityCard
    title="Workout suggestions"
    description="Recommend workouts from activity patterns."
    emptyMessage="No workout suggestions available yet."
    load={loadSuggestions}
    renderItem={(suggestion) => <><strong>{suggestion.title}</strong><span className="d-block">{suggestion.reason}</span></>}
  />;
}

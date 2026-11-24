# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Build the four capability pages in React using routed components and the shared `getJson` API client. Each page will use a single request and render explicit loading, success, empty, and accessible error states. Bootstrap will provide layout and status styling without introducing presentation-specific API logic.
- Logic tier decision: Keep Express routes thin and put validation and capability behavior in explicit service functions. Routes will translate service results into JSON responses and service errors into existing deliberate HTTP 4xx responses, while leaving the shared app error middleware to handle unexpected failures.
- Data tier decision: Use Mongoose schemas as the validation boundary and MongoDB collections as the persistent data source. Keep seed data stable and idempotent through upserts, preserve unrelated records, and reconcile demo-user team memberships when fixture assignments change.
- Activity tracking approach: Validate `userId`, `teamId`, `type`, and `minutes` before creating a record. Reject malformed or missing ObjectIds and nonexistent references with 4xx responses, compute positive points from the submitted activity, set `occurredAt` to creation time, and return the stored record for both create and list operations.
- Team management approach: Require a non-empty `name` and preserve the submitted `mascot`; accept an optional `members` array and default it to an empty array. Convert valid member IDs to ObjectIds and create or list teams without accepting invalid team input.
- Leaderboard approach: Aggregate activity points by each activity's team, sum those points, sort descending, and assign a 1-based rank. Return only `teamName`, `totalPoints`, and `rank`, using the team name associated with the activity's team reference.
- Workout suggestions approach: Resolve the requested email to a seeded or existing user, then match workout suggestions against the user's `fitnessGoal` and recent activity type. Return the strongest matching workout first and include a reason tied to that user's goal or activity; return a 4xx when the email does not identify a user.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — Run this first to verify Mongoose required fields, team member defaults, activity/workout validation, seed fixtures, and idempotent preservation of unrelated data. Schema or seed failures indicate work is incomplete in the data tier.
- API command: `npm run test:api --prefix octofit-tracker/backend` — Run after the data tier to verify activity and team creation, reference validation, leaderboard ordering, workout matching, and deliberate 4xx responses. Route failures here indicate missing service behavior or incorrect API contracts.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — Run after the API contracts to verify the shared client, routed capability data, and accessible loading, empty, success, and error states. Mock failures or missing text/status roles indicate presentation-tier gaps.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — Run after API tests to catch Express, Mongoose, or TypeScript type errors. A failure means the backend implementation does not compile, independently of runtime contract behavior.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — Run after frontend tests to verify React/TypeScript components and the Vite production build. A failure means presentation code or API client usage has a compile or bundling issue.

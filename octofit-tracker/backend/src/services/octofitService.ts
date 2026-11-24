import { Activity, Team, User, Workout } from '../models/index.js';
import { isValidObjectId } from 'mongoose';

function badRequest(message: string): never {
  throw Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string): never {
  throw Object.assign(new Error(message), { status: 404 });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    badRequest('Activity input is required');
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: unknown;
    teamId?: unknown;
    type?: unknown;
    minutes?: unknown;
  };

  if (typeof userId !== 'string' || typeof teamId !== 'string') {
    badRequest('Valid userId and teamId are required');
  }
  if (!isValidObjectId(userId) || !isValidObjectId(teamId)) {
    badRequest('Valid userId and teamId are required');
  }
  if (typeof type !== 'string' || type.trim() === '') {
    badRequest('Activity type is required');
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    badRequest('Minutes must be a positive number');
  }

  const [user, team] = await Promise.all([
    User.findById(userId).lean(),
    Team.findById(teamId).lean(),
  ]);
  if (!user) notFound('User not found');
  if (!team) notFound('Team not found');

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
  badRequest('Team input is required');
  }

  const { name, mascot, members } = input as {
  name?: unknown;
  mascot?: unknown;
  members?: unknown;
  };

  if (typeof name !== 'string' || name.trim() === '') {
  badRequest('Team name is required');
  }
  if (typeof mascot !== 'string' || mascot.trim() === '') {
  badRequest('Team mascot is required');
  }

  const memberIds = members === undefined ? [] : members;
  if (!Array.isArray(memberIds) || memberIds.some((id) => typeof id !== 'string' || !isValidObjectId(id))) {
  badRequest('Members must contain valid user IDs');
  }

  const users = await User.find({ _id: { $in: memberIds } }).lean();
  if (users.length !== memberIds.length) {
  notFound('One or more team members not found');
  }

  const team = await Team.create({
  name: name.trim(),
  mascot: mascot.trim(),
  members: memberIds,
  });
  await User.updateMany(
  { _id: { $in: memberIds } },
  { $set: { team: team._id } },
  );

  return team;
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    {
      $group: {
        _id: '$team',
        totalPoints: { $sum: '$points' },
      },
    },
  ]);

  const teamIds = totals.map(({ _id }) => _id);
  const teams = await Team.find({ _id: { $in: teamIds } }).lean();
  const teamNames = new Map(
    teams.map((team) => [team._id.toString(), team.name]),
  );

  return totals
    .map((entry) => ({
      teamName: teamNames.get(entry._id.toString()) ?? 'Unknown team',
      totalPoints: entry.totalPoints,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.teamName.localeCompare(b.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) notFound('User not found');

  const activities = await Activity.find({ user: user._id }).lean();
  const activityTypes = new Set(
    activities.map((activity) => activity.type.toLowerCase()),
  );

  let focus = user.fitnessGoal?.toLowerCase() ?? '';
  if (activityTypes.has('strength')) {
    focus = 'strength';
  } else if (
    activityTypes.has('run') ||
    activityTypes.has('cycle') ||
    activityTypes.has('ride') ||
    activityTypes.has('swim')
  ) {
    focus = 'endurance';
  }

  const matching = await Workout.find({
    focus: { $regex: `^${focus}$`, $options: 'i' },
  }).lean();
  const workouts = matching.length > 0
    ? matching
    : await Workout.find().lean();

  return workouts.slice(0, 3).map((workout) => {
    const matchedType = [...activityTypes].find((type) => (
      workout.focus.toLowerCase().includes(type) ||
      workout.title?.toLowerCase().includes(type)
    ));
    const reason = matchedType
      ? `Matches your ${matchedType} activity pattern`
      : `Matches your ${workout.focus} fitness goal`;
    return { ...workout, reason };
  });
}

export { User };

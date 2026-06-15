import { db } from './db/bellboundDb.js';

// seed() is safe to call on every startup — it checks for the sentinel character
// and returns immediately if it already exists. All writes are in one transaction.
export async function seed(today = new Date().toISOString().slice(0, 10)): Promise<void> {
  const existing = await db.characters.get('player-1');
  if (existing) return;

  await db.transaction('rw', [db.characters, db.weekTemplates, db.blocks, db.workoutTemplates], async () => {
    await db.characters.add({
      userId: 'player-1',
      characterName: 'Adventurer',
      className: 'bellbarian',
      level: 1,
      stats: {
        strength: 0,
        conditioning: 0,
        control: 0,
        consistency: 0,
        recovery: 0,
        judgment: 0,
      },
    });

    await db.weekTemplates.add({
      id: 'default',
      days: {
        monday: 'kb',
        tuesday: 'kb',
        wednesday: 'rest',
        thursday: 'kb',
        friday: 'kb',
        saturday: 'free',
        sunday: 'rest',
      },
    });

    await db.blocks.add({
      id: 'block-1',
      name: 'Block 1',
      baselineTier: 1,
      startDate: today,
      status: 'active',
      testGuardMinSessions: 6,
      completedPlannedKbSessions: 0,
    });

    await db.workoutTemplates.add({
      id: 'dkbs',
      name: 'Double KB Strength',
      zoneName: 'The Double-Bell Gate',
      category: 'kettlebell',
      defaultRest: 90,
      tierStep: '+1 round per tier',
      tiers: {
        '1': { rounds: 4 },
        '2': { rounds: 5 },
        '3': { rounds: 6 },
      },
      movements: [
        { name: 'Double Clean', reps: 5, load: 20 },
        { name: 'Double Press', reps: 3, load: 20 },
        { name: 'Double Front Squat', reps: 5, load: 20 },
        { name: 'Push-ups', reps: 10 },
        { name: 'Farmer Carry', duration: 30, load: 20 },
      ],
    });

    await db.workoutTemplates.add({
      id: 'abc',
      name: 'Armor Building Complex',
      zoneName: 'The Armor Foundry',
      category: 'kettlebell',
      defaultRest: 60,
      tierStep: '+2 sets per tier',
      tiers: {
        '1': { rounds: 10 },
        '2': { rounds: 12 },
        '3': { rounds: 15 },
        '4': { rounds: 20 },
      },
      movements: [
        { name: 'Double Clean', reps: 1 },
        { name: 'Press', reps: 1 },
        { name: 'Front Squat', reps: 1 },
      ],
    });

    await db.workoutTemplates.add({
      id: 'skbs',
      name: 'Single KB Strength',
      zoneName: 'The Single-Bell Outpost',
      category: 'kettlebell',
      defaultRest: 90,
      tierStep: '+1 round per tier',
      tiers: {
        '1': { rounds: 3 },
        '2': { rounds: 4 },
        '3': { rounds: 5 },
      },
      movements: [
        { name: 'Clean', reps: 5, load: 16 },
        { name: 'Press', reps: 3, load: 16 },
        { name: 'Front Squat', reps: 5, load: 16 },
        { name: 'Push-ups', reps: 10 },
      ],
    });

    await db.workoutTemplates.add({
      id: 'swing-conditioning',
      name: 'Swing / Push-up Conditioning',
      zoneName: 'The Swing Marsh',
      category: 'kettlebell',
      defaultRest: 30,
      tierStep: '+1 set per tier',
      tiers: {
        '1': { rounds: 5 },
        '2': { rounds: 6 },
        '3': { rounds: 7 },
        '4': { rounds: 8 },
      },
      movements: [
        { name: 'Two-hand Swing', reps: 10, load: 24 },
        { name: 'Push-up', reps: 10 },
      ],
    });

    await db.workoutTemplates.add({
      id: 'recovery',
      name: 'Rest / Recovery',
      zoneName: 'The Recovery Inn',
      category: 'recovery',
      defaultRest: 0,
      tierStep: 'no progression',
      tiers: {},
      movements: [],
    });
  });
}

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
      className: 'Kettlebell Practitioner',
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
      zoneName: 'Strength Zone',
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
  });
}

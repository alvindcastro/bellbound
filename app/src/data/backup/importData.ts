import { db } from '../db/bellboundDb.js';
import type { BackupData } from './exportData.js';

export async function deserializeAndRestore(data: BackupData): Promise<void> {
  if (!data?.tables) throw new Error('Invalid backup: missing tables');

  await db.transaction(
    'rw',
    [
      db.characters,
      db.blocks,
      db.weekTemplates,
      db.workoutTemplates,
      db.workoutLogs,
      db.dailyContext,
      db.statusEffects,
    ],
    async () => {
      await db.characters.clear();
      await db.blocks.clear();
      await db.weekTemplates.clear();
      await db.workoutTemplates.clear();
      await db.workoutLogs.clear();
      await db.dailyContext.clear();
      await db.statusEffects.clear();

      if (data.tables.characters.length) await db.characters.bulkPut(data.tables.characters);
      if (data.tables.blocks.length) await db.blocks.bulkPut(data.tables.blocks);
      if (data.tables.weekTemplates.length) await db.weekTemplates.bulkPut(data.tables.weekTemplates);
      if (data.tables.workoutTemplates.length) await db.workoutTemplates.bulkPut(data.tables.workoutTemplates);
      if (data.tables.workoutLogs.length) await db.workoutLogs.bulkPut(data.tables.workoutLogs);
      if (data.tables.dailyContext.length) await db.dailyContext.bulkPut(data.tables.dailyContext);
      if (data.tables.statusEffects.length) await db.statusEffects.bulkPut(data.tables.statusEffects);
    },
  );
}

export async function importFromJson(json: string): Promise<void> {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('Invalid backup: not valid JSON');
  }
  if (!data || typeof data !== 'object' || !('tables' in data)) {
    throw new Error('Invalid backup: missing tables key');
  }
  await deserializeAndRestore(data as BackupData);
}

// Browser-only: reads a File object and calls importFromJson. Not unit-tested (requires DOM).
export async function importFromFile(file: File): Promise<void> {
  const json = await file.text();
  await importFromJson(json);
}

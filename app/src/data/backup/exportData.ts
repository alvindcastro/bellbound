// Backup is mandatory for this app because iOS WebKit can evict IndexedDB after
// 7 days of inactivity. This foundation is built early on purpose.

import { db } from '../db/bellboundDb.js';
import type {
  CharacterRow,
  BlockRow,
  WeekTemplateRow,
  WorkoutTemplateRow,
  WorkoutLogRow,
  DailyContextRow,
  StatusEffectRow,
} from '../db/bellboundDb.js';

export interface BackupData {
  version: 1;
  exportedAt: string;
  tables: {
    characters: CharacterRow[];
    blocks: BlockRow[];
    weekTemplates: WeekTemplateRow[];
    workoutTemplates: WorkoutTemplateRow[];
    workoutLogs: WorkoutLogRow[];
    dailyContext: DailyContextRow[];
    statusEffects: StatusEffectRow[];
  };
}

export async function serializeDb(): Promise<BackupData> {
  const [
    characters,
    blocks,
    weekTemplates,
    workoutTemplates,
    workoutLogs,
    dailyContext,
    statusEffects,
  ] = await Promise.all([
    db.characters.toArray(),
    db.blocks.toArray(),
    db.weekTemplates.toArray(),
    db.workoutTemplates.toArray(),
    db.workoutLogs.toArray(),
    db.dailyContext.toArray(),
    db.statusEffects.toArray(),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    tables: {
      characters,
      blocks,
      weekTemplates,
      workoutTemplates,
      workoutLogs,
      dailyContext,
      statusEffects,
    },
  };
}

// Browser-only: triggers a .json file download. Not unit-tested (requires DOM).
export async function downloadBackup(): Promise<void> {
  const data = await serializeDb();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bellbound-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

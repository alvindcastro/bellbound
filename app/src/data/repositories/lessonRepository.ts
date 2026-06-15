import { db } from '../db/bellboundDb.js';
import type { LessonRow } from '../db/bellboundDb.js';

export const lessonRepository = {
  async add(lesson: LessonRow): Promise<void> {
    await db.lessons.add(lesson);
  },

  async listAll(): Promise<LessonRow[]> {
    return db.lessons.toArray();
  },
};

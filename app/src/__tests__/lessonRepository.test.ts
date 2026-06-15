import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../data/db/bellboundDb.js';
import { lessonRepository } from '../data/repositories/lessonRepository.js';

beforeEach(async () => {
  await db.open();
});

afterEach(async () => {
  await db.delete();
});

describe('lessonRepository', () => {
  it('add stores a lesson row', async () => {
    await lessonRepository.add({
      id: 'lesson-1',
      title: 'Trust the Press',
      description: 'The press is the test.',
      earnedDate: '2026-06-15',
      blockId: 'block-1',
    });
    const row = await db.lessons.get('lesson-1');
    expect(row).not.toBeNull();
    expect(row?.id).toBe('lesson-1');
    expect(row?.title).toBe('Trust the Press');
    expect(row?.blockId).toBe('block-1');
  });

  it('listAll returns an empty array when no lessons exist', async () => {
    const lessons = await lessonRepository.listAll();
    expect(lessons).toEqual([]);
  });

  it('listAll returns all lessons', async () => {
    await lessonRepository.add({
      id: 'lesson-1',
      title: 'Trust the Press',
      description: 'The press is the test.',
      earnedDate: '2026-06-15',
      blockId: 'block-1',
    });
    await lessonRepository.add({
      id: 'lesson-2',
      title: 'Rest Is Training',
      description: 'Rest days are not lost days.',
      earnedDate: '2026-09-01',
      blockId: 'block-2',
    });
    const lessons = await lessonRepository.listAll();
    expect(lessons).toHaveLength(2);
    const ids = lessons.map((l) => l.id).sort();
    expect(ids).toEqual(['lesson-1', 'lesson-2']);
  });
});

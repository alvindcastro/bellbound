import type { Block } from '../entities/block.js';
import type { WorkoutLog } from '../entities/workoutLog.js';
import type { PermanentLesson } from '../entities/lesson.js';
import { TEST_GUARD_MIN_SESSIONS } from '../config.js';

export interface BlockTransitionResult {
  nextBlock: Block;
  lesson: PermanentLesson;
}

const LESSONS: Array<{ title: string; description: string }> = [
  {
    title: 'Repeat Before Increase',
    description: 'The baseline repeats until it flows. Patience is the program.',
  },
  {
    title: 'Sleep Is Real Work',
    description: 'Sleep deficit is a real training variable. Log it honestly and respect it.',
  },
  {
    title: 'Press Before Squat',
    description: 'Pressing strength leads. Protect the press in every session.',
  },
];

export function computeBlockTransition(
  closingBlock: Block,
  _testLog: WorkoutLog,
  newBlockId: string,
  startDate: string,
): BlockTransitionResult {
  const nextBlock: Block = {
    id: newBlockId,
    name: `Block ${closingBlock.baselineTier + 1}`,
    baselineTier: closingBlock.baselineTier + 1,
    startDate,
    status: 'active',
    testGuardMinSessions: TEST_GUARD_MIN_SESSIONS,
    completedPlannedKbSessions: 0,
  };

  const lessonTemplate = LESSONS[(closingBlock.baselineTier - 1) % LESSONS.length]!;
  const lesson: PermanentLesson = {
    id: `lesson-${closingBlock.id}-${closingBlock.baselineTier}`,
    title: lessonTemplate.title,
    description: lessonTemplate.description,
    earnedDate: startDate,
    blockId: closingBlock.id,
  };

  return { nextBlock, lesson };
}

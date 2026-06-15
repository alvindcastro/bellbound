export interface PermanentLesson {
  id: string;
  title: string;
  description: string;
  earnedDate: string; // ISO date string
  blockId: string;    // the block this lesson was banked from
}

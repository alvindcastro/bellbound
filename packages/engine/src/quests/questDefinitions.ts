import type { QuestDefinition } from '../entities/quest.js';

export const QUEST_DEFINITIONS: readonly QuestDefinition[] = [
  {
    id: 'survive_baseline',
    name: 'Survive the Baseline',
    objective: 'Complete 2 planned kettlebell sessions',
    required: 2,
    reward: {
      type: 'item',
      id: 'item_double_kb_standard',
      name: 'Double KB Standard',
      flavourText: 'You held the line.',
    },
  },
  {
    id: 'wise_regression',
    name: 'The Wise Regression',
    objective: 'Complete a kettlebell session at easy difficulty',
    required: 1,
    reward: {
      type: 'title',
      id: 'title_the_unhurried',
      name: 'The Unhurried',
      flavourText: 'The bell was heavy. You chose not to grind.',
    },
  },
  {
    id: 'good_swap',
    name: 'The Good Swap',
    objective: 'Train on an unplanned day',
    required: 1,
    reward: {
      type: 'title',
      id: 'title_the_adaptable',
      name: 'The Adaptable',
      flavourText: 'The plan changed. You trained anyway.',
    },
  },
];
// Quests requiring structured exercise data (swing counts, push-up counts, ABC sets)
// are deferred until actualWorkout has a structured schema:
//   Enter the Armor Foundry (10 ABC sets)
//   The Hundred Swings (100 swings at 24 kg)
//   The Push-up Bureaucracy (100 push-ups in one session)

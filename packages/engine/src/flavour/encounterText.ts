const ENCOUNTER_TEXT: Record<string, string> = {
  'Double Clean': 'You clean the bells. They cooperate, reluctantly.',
  'Double Press': 'You press the bells overhead. The ceiling remains unimpressed.',
  'Double Front Squat': 'You descend into the Squat Mines. The quads begin collective bargaining.',
  'Push-ups': 'You push the floor away. The floor is unmoved.',
  'Farmer Carry': 'You carry the bells. They are heavy. This is the point.',
  'Clean': 'You clean the bell. One-handed authority.',
  'Press': 'You press the bell. The shoulder agrees, this time.',
  'Front Squat': 'You descend. The quads file a complaint.',
  'Two-hand Swing': 'The bell arcs. Power from the hips, not the ceiling.',
  'Push-up': 'The floor resists. You insist.',
};

export function getEncounterText(movementName: string): string {
  return ENCOUNTER_TEXT[movementName] ?? '';
}

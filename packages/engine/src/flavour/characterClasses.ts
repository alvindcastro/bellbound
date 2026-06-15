export interface CharacterClass {
  id: string;
  displayName: string;
  flavourMessage: string;
}

export const CHARACTER_CLASSES: CharacterClass[] = [
  { id: 'bellbarian', displayName: 'Bellbarian', flavourMessage: 'You swing first and ask questions never.' },
  { id: 'pressomancer', displayName: 'Pressomancer', flavourMessage: 'You have pressed things into submission. The ceiling fears you.' },
  { id: 'squat-squire', displayName: 'Squat Squire', flavourMessage: 'You descend loyally. The quads have filed a complaint.' },
  { id: 'recovery-rogue', displayName: 'Recovery Rogue', flavourMessage: 'You rest with intent. This is suspicious. Keep it up.' },
  { id: 'program-warlock', displayName: 'Program Warlock', flavourMessage: 'You follow the program. You do not deviate. The program is correct.' },
];

export function getCharacterClass(id: string): CharacterClass {
  return CHARACTER_CLASSES.find(c => c.id === id) ?? CHARACTER_CLASSES[0]!;
}

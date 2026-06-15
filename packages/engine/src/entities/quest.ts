export interface QuestRewardDefinition {
  type: 'item' | 'title';
  id: string;
  name: string;
  flavourText: string;
}

export interface QuestDefinition {
  id: string;
  name: string;
  objective: string;
  required: number;
  reward: QuestRewardDefinition;
}

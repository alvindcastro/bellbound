export function shouldGrantReward(progress: number, required: number, alreadyCompleted: boolean): boolean {
  return !alreadyCompleted && progress >= required;
}

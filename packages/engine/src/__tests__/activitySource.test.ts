import { describe, it, expect } from 'vitest';
import { defaultSourceForActivity } from '../activities/activitySource.js';

describe('defaultSourceForActivity', () => {
  it('maps run to off_block', () => {
    expect(defaultSourceForActivity('run')).toBe('off_block');
  });

  it('maps pickleball to off_block', () => {
    expect(defaultSourceForActivity('pickleball')).toBe('off_block');
  });

  it('maps barbell to off_block', () => {
    expect(defaultSourceForActivity('barbell')).toBe('off_block');
  });

  it('maps hike to recovery_skill', () => {
    expect(defaultSourceForActivity('hike')).toBe('recovery_skill');
  });

  it('maps yoga to recovery_skill', () => {
    expect(defaultSourceForActivity('yoga')).toBe('recovery_skill');
  });

  it('maps walk to recovery_skill', () => {
    expect(defaultSourceForActivity('walk')).toBe('recovery_skill');
  });

  it('maps reading to recovery_skill', () => {
    expect(defaultSourceForActivity('reading')).toBe('recovery_skill');
  });

  it('maps cube to recovery_skill', () => {
    expect(defaultSourceForActivity('cube')).toBe('recovery_skill');
  });

  it('maps unknown activity to recovery_skill (safe default)', () => {
    expect(defaultSourceForActivity('unicycle')).toBe('recovery_skill');
    expect(defaultSourceForActivity('')).toBe('recovery_skill');
    expect(defaultSourceForActivity('UNKNOWN')).toBe('recovery_skill');
  });
});

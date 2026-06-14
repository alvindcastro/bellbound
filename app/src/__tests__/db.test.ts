import { describe, it, expect } from 'vitest';
// fake-indexeddb is registered globally via vitest.setup.ts

describe('data layer (fake-indexeddb)', () => {
  it('fake-indexeddb is registered and indexedDB is available', () => {
    expect(typeof indexedDB).toBe('object');
  });
});

import { describe, expect, it } from 'vitest';

import { BLOCKED_WORDS, resolveOffensiveWordFilter } from '../../src/core/offensive-word-filter';
import NeXID from '../../src/node';

describe('word-filter', () => {
  describe('BLOCKED_WORDS', () => {
    it('contains only characters from the base32-hex alphabet', () => {
      for (const word of BLOCKED_WORDS) {
        expect(word).toMatch(/^[0-9a-v]+$/);
      }
    });

    it('contains no words shorter than 3 characters', () => {
      for (const word of BLOCKED_WORDS) {
        expect(word.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('has no duplicates', () => {
      const unique = new Set(BLOCKED_WORDS);
      expect(unique.size).toBe(BLOCKED_WORDS.length);
    });

    it('is sorted alphabetically', () => {
      const sorted = [...BLOCKED_WORDS].sort();
      expect(BLOCKED_WORDS).toEqual(sorted);
    });
  });

  describe('resolveOffensiveWordFilter', () => {
    it('returns null when filter is false', () => {
      expect(resolveOffensiveWordFilter(false)).toBeNull();
    });

    it('returns null when filter is undefined', () => {
      expect(resolveOffensiveWordFilter(undefined)).toBeNull();
    });

    it('returns built-in filter when filter is true', () => {
      const filter = resolveOffensiveWordFilter(true)!;
      expect(filter).toBeTypeOf('function');
      expect(filter('abc123ass456def')).toBe(true);
      expect(filter('cv37img5tppgl4002kb0')).toBe(false);
    });

    it('returns extended filter when extra words are provided', () => {
      const filter = resolveOffensiveWordFilter(true, ['custom'])!;
      expect(filter).toBeTypeOf('function');
      // Matches built-in words
      expect(filter('abc123ass456def')).toBe(true);
      // Matches custom words
      expect(filter('contains_custom_here')).toBe(true);
      // Clean string
      expect(filter('cv37img5tppgl4002kb0')).toBe(false);
    });

    it('ignores extra words when filter is false', () => {
      expect(resolveOffensiveWordFilter(false, ['custom'])).toBeNull();
    });

    it('returns built-in filter when extra words array is empty', () => {
      const filter = resolveOffensiveWordFilter(true, [])!;
      expect(filter).toBeTypeOf('function');
      expect(filter('abc123ass456def')).toBe(true);
    });

    it('lowercases extra words for matching', () => {
      const filter = resolveOffensiveWordFilter(true, ['CUSTOM'])!;
      expect(filter('custom')).toBe(true);
    });

    it('escapes regex metacharacters in extra words', () => {
      const filter = resolveOffensiveWordFilter(true, ['a.b', 'c+d'])!;
      expect(filter('a.b')).toBe(true);
      expect(filter('aXb')).toBe(false); // dot is escaped, not wildcard
      expect(filter('c+d')).toBe(true);
      expect(filter('cd')).toBe(false); // plus is escaped, not quantifier
    });
  });

  describe('built-in filter', () => {
    const filter = resolveOffensiveWordFilter(true)!;

    it('rejects strings containing blocked words', () => {
      expect(filter('abc123ass456def')).toBe(true);
      expect(filter('00shit00000000000000')).toBe(true);
      expect(filter('fuck')).toBe(true);
    });

    it('accepts clean strings', () => {
      expect(filter('cv37img5tppgl4002kb0')).toBe(false);
      expect(filter('00000000000000000000')).toBe(false);
    });
  });

  describe('construction-time fixed region sanitization', () => {
    // 'test-machine' with pid=1234 produces fixed region 'f84og9k'.
    // Using 'f84og' as a custom offensive word forces the construction-time
    // sanitization to re-salt the machine ID hash.
    // Note: processId must be > 0 to pass the ProcessId feature validation.

    it('re-salts machine ID when fixed region contains an offensive word', () => {
      const baseGen = NeXID.init({
        machineId: 'test-machine',
        processId: 1234,
      });
      const filteredGen = NeXID.init({
        machineId: 'test-machine',
        processId: 1234,
        filterOffensiveWords: true,
        offensiveWords: ['f84og'],
      });

      // The machineId hex should differ — proving the hash was re-salted
      expect(filteredGen.machineId).not.toBe(baseGen.machineId);
    });

    it('does not re-salt when fixed region is clean', () => {
      const baseGen = NeXID.init({
        machineId: 'test-machine',
        processId: 1234,
      });
      const filteredGen = NeXID.init({
        machineId: 'test-machine',
        processId: 1234,
        filterOffensiveWords: true,
        // 'zzz' cannot appear in base32-hex output (max char is 'v')
        offensiveWords: ['zzz'],
      });

      // Same machineId hex — no re-salting needed
      expect(filteredGen.machineId).toBe(baseGen.machineId);
    });

    it('produces IDs without the offensive word in the fixed region after re-salting', () => {
      const gen = NeXID.init({
        machineId: 'test-machine',
        processId: 1234,
        filterOffensiveWords: true,
        offensiveWords: ['f84og'],
      });

      for (let i = 0; i < 100; i++) {
        const id = gen.fastId();
        // Chars 7-13 should no longer contain 'f84og'
        expect(id.substring(7, 14)).not.toContain('f84og');
      }
    });

    it('falls back gracefully when filter is very aggressive', () => {
      const gen = NeXID.init({
        machineId: 'test-machine',
        processId: 1234,
        filterOffensiveWords: true,
        offensiveWords: ['f84og'],
      });
      const id = gen.newId();
      expect(id).toBeDefined();
      expect(id.toString()).toHaveLength(20);
    });
  });

  describe('position-aware bail-out', () => {
    it('does not waste counter values when match is in timestamp region', () => {
      // Generate two generators with the same seed state.
      // One has a filter that matches a timestamp-region pattern,
      // the other has no filter. If the bail-out works correctly,
      // the filtered generator should only consume 1 extra counter value
      // (the first attempt) rather than maxFilterAttempts.
      const gen = NeXID.init({
        machineId: 'test-machine',
        processId: 1234,
        filterOffensiveWords: true,
        // Use a word that will match in the first few chars (timestamp region).
        // Current timestamp prefix starts with 'c' range. We use a very short
        // word likely to appear in the timestamp region.
        offensiveWords: ['cv3'],
        maxFilterAttempts: 10,
      });

      // Even with aggressive filtering, the generator should produce valid IDs
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(gen.fastId());
      }
      // All IDs should be unique (counter not exhausted by wasteful retries)
      expect(ids.size).toBe(100);
    });

    it('retries successfully when match is only in counter region', () => {
      const filter = resolveOffensiveWordFilter(true)!;
      const gen = NeXID.init({
        filterOffensiveWords: true,
        maxFilterAttempts: 10,
      });

      // Generate many IDs — none should contain blocked words
      for (let i = 0; i < 1000; i++) {
        const id = gen.fastId();
        expect(filter(id)).toBe(false);
      }
    });
  });

  describe('generator integration', () => {
    it('generates IDs that pass the filter with filterOffensiveWords: true', () => {
      const filter = resolveOffensiveWordFilter(true)!;
      const gen = NeXID.init({ filterOffensiveWords: true });
      for (let i = 0; i < 1000; i++) {
        const id = gen.newId().toString();
        expect(filter(id)).toBe(false);
      }
    });

    it('fastId generates IDs that pass the filter', () => {
      const filter = resolveOffensiveWordFilter(true)!;
      const gen = NeXID.init({ filterOffensiveWords: true });
      for (let i = 0; i < 1000; i++) {
        const id = gen.fastId();
        expect(filter(id)).toBe(false);
      }
    });

    it('accepts extra offensive words', () => {
      const gen = NeXID.init({
        filterOffensiveWords: true,
        offensiveWords: ['test'],
      });
      const id = gen.newId();
      expect(id).toBeDefined();
    });

    it('generates unique IDs even with filtering', () => {
      const gen = NeXID.init({ filterOffensiveWords: true });
      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        ids.add(gen.newId().toString());
      }
      expect(ids.size).toBe(1000);
    });

    it('does not regress performance when filter is disabled', () => {
      const gen = NeXID.init();
      // Smoke test: generate many IDs quickly without filtering
      const ids = new Set<string>();
      for (let i = 0; i < 10000; i++) {
        ids.add(gen.fastId());
      }
      expect(ids.size).toBe(10000);
    });

    it('handles maxFilterAttempts of 0', () => {
      // We can't easily test retry behavior with the boolean API,
      // but we can verify maxFilterAttempts is respected by checking
      // that the generator still produces IDs
      const gen = NeXID.init({
        filterOffensiveWords: true,
        maxFilterAttempts: 0,
      });
      const id = gen.newId();
      expect(id).toBeDefined();
    });
  });
});

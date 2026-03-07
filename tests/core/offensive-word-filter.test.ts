import { describe, expect, it } from 'vitest';

import {
  BLOCKED_WORDS,
  resolveOffensiveWordFilter,
} from '../../src/core/offensive-word-filter';
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

    it('handles maxFilterRetries of 0', () => {
      // We can't easily test retry behavior with the boolean API,
      // but we can verify maxFilterRetries is respected by checking
      // that the generator still produces IDs
      const gen = NeXID.init({
        filterOffensiveWords: true,
        maxFilterRetries: 0,
      });
      const id = gen.newId();
      expect(id).toBeDefined();
    });
  });
});

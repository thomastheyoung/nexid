import { describe, expect, it } from 'vitest';

import {
  BLOCKED_WORDS,
  resolveWordFilter,
} from '../../src/core/word-filter';
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

  describe('resolveWordFilter', () => {
    it('returns null for undefined', () => {
      expect(resolveWordFilter(undefined)).toBeNull();
    });

    it('returns built-in filter for true', () => {
      const filter = resolveWordFilter(true)!;
      expect(filter).toBeTypeOf('function');
      expect(filter('abc123ass456def')).toBe(true);
      expect(filter('cv37img5tppgl4002kb0')).toBe(false);
    });

    it('returns a filter from a custom word list', () => {
      const filter = resolveWordFilter(['bad', 'nope'])!;
      expect(filter('contains_bad_stuff')).toBe(true);
      expect(filter('contains_nope_here')).toBe(true);
      expect(filter('clean_string')).toBe(false);
    });

    it('returns null for empty word list', () => {
      expect(resolveWordFilter([])).toBeNull();
    });

    it('uses a custom function as-is', () => {
      const fn = (s: string) => s.includes('x');
      expect(resolveWordFilter(fn)).toBe(fn);
    });

    it('escapes regex metacharacters in custom words', () => {
      const filter = resolveWordFilter(['a.b', 'c+d'])!;
      expect(filter('a.b')).toBe(true);
      expect(filter('aXb')).toBe(false); // dot is escaped, not wildcard
      expect(filter('c+d')).toBe(true);
      expect(filter('cd')).toBe(false); // plus is escaped, not quantifier
    });

    it('lowercases custom words for matching', () => {
      const filter = resolveWordFilter(['BAD'])!;
      expect(filter('bad')).toBe(true);
    });
  });

  describe('built-in filter via true', () => {
    const filter = resolveWordFilter(true)!;

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
    it('generates IDs that pass the filter with wordFilter: true', () => {
      const filter = resolveWordFilter(true)!;
      const gen = NeXID.init({ wordFilter: true });
      for (let i = 0; i < 1000; i++) {
        const id = gen.newId().toString();
        expect(filter(id as string)).toBe(false);
      }
    });

    it('fastId generates IDs that pass the filter', () => {
      const filter = resolveWordFilter(true)!;
      const gen = NeXID.init({ wordFilter: true });
      for (let i = 0; i < 1000; i++) {
        const id = gen.fastId();
        expect(filter(id as string)).toBe(false);
      }
    });

    it('accepts a custom word list', () => {
      const gen = NeXID.init({ wordFilter: ['test'] });
      const id = gen.newId();
      expect(id).toBeDefined();
    });

    it('retries when filter rejects an ID', () => {
      let callCount = 0;
      // Filter that rejects the first 3 IDs
      const filter = () => {
        callCount++;
        return callCount <= 3;
      };
      const gen = NeXID.init({ wordFilter: filter });
      const id = gen.newId();
      expect(id).toBeDefined();
      expect(callCount).toBe(4); // 3 rejected + 1 accepted
    });

    it('returns last ID after exhausting retries', () => {
      // Filter that always rejects
      const gen = NeXID.init({
        wordFilter: () => true,
        maxFilterRetries: 3,
      });
      // Should not throw — returns last generated ID
      const id = gen.newId();
      expect(id).toBeDefined();
    });

    it('generates unique IDs even with filtering', () => {
      const gen = NeXID.init({ wordFilter: true });
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
        ids.add(gen.fastId() as string);
      }
      expect(ids.size).toBe(10000);
    });

    it('handles maxFilterRetries of 0', () => {
      let callCount = 0;
      const gen = NeXID.init({
        wordFilter: () => { callCount++; return true; },
        maxFilterRetries: 0,
      });
      const id = gen.newId();
      expect(id).toBeDefined();
      // With 0 retries, the filter is called once (attempt 0)
      expect(callCount).toBe(1);
    });
  });
});

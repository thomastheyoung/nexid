import { describe, expect, it } from 'vitest';

import {
  BLOCKED_WORDS,
  createWordFilter,
  defaultWordFilter,
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

  describe('defaultWordFilter', () => {
    it('rejects strings containing blocked words', () => {
      expect(defaultWordFilter('abc123ass456def')).toBe(true);
      expect(defaultWordFilter('00shit00000000000000')).toBe(true);
      expect(defaultWordFilter('fuck')).toBe(true);
    });

    it('accepts clean strings', () => {
      expect(defaultWordFilter('cv37img5tppgl4002kb0')).toBe(false);
      expect(defaultWordFilter('00000000000000000000')).toBe(false);
    });
  });

  describe('createWordFilter', () => {
    it('creates a filter from custom words', () => {
      const filter = createWordFilter(['bad', 'nope']);
      expect(filter('contains_bad_stuff')).toBe(true);
      expect(filter('contains_nope_here')).toBe(true);
      expect(filter('clean_string')).toBe(false);
    });

    it('returns a no-op filter for empty word list', () => {
      const filter = createWordFilter([]);
      expect(filter('anything')).toBe(false);
      expect(filter('ass')).toBe(false);
    });

    it('escapes regex metacharacters in custom words', () => {
      const filter = createWordFilter(['a.b', 'c+d']);
      expect(filter('a.b')).toBe(true);
      expect(filter('aXb')).toBe(false); // dot is escaped, not wildcard
      expect(filter('c+d')).toBe(true);
      expect(filter('cd')).toBe(false); // plus is escaped, not quantifier
    });

    it('lowercases custom words for matching', () => {
      const filter = createWordFilter(['BAD']);
      expect(filter('bad')).toBe(true);
    });
  });

  describe('generator integration', () => {
    it('generates IDs that pass the filter', () => {
      const gen = NeXID.init({ wordFilter: defaultWordFilter });
      for (let i = 0; i < 1000; i++) {
        const id = gen.newId().toString();
        expect(defaultWordFilter(id as string)).toBe(false);
      }
    });

    it('fastId generates IDs that pass the filter', () => {
      const gen = NeXID.init({ wordFilter: defaultWordFilter });
      for (let i = 0; i < 1000; i++) {
        const id = gen.fastId();
        expect(defaultWordFilter(id as string)).toBe(false);
      }
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
      const gen = NeXID.init({ wordFilter: defaultWordFilter });
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

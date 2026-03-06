/**
 * @module nexid/core/word-filter
 *
 * Post-generation word filter for XID strings.
 *
 * ARCHITECTURE:
 * This module provides a mechanism to reject generated IDs that contain
 * offensive words as substrings. It ships a curated built-in blocklist
 * and utilities for creating custom filters. Filters are simple predicates
 * that return true when an encoded string should be rejected.
 *
 * The built-in regex is lazily compiled on first use so that applications
 * that do not enable filtering pay zero cost (and bundlers can tree-shake
 * the blocklist away entirely).
 */

/**
 * Predicate that returns true if the encoded string should be rejected.
 */
export type WordFilterFn = (encoded: string) => boolean;

/**
 * Accepted shapes for the `wordFilter` option:
 * - `true` — use the built-in offensive-word blocklist
 * - `string[]` — custom word list (compiled to a regex internally)
 * - `WordFilterFn` — fully custom predicate
 */
export type WordFilterOption = true | readonly string[] | WordFilterFn;

/**
 * Built-in blocklist of offensive words (3+ chars) that can be formed
 * from the base32-hex alphabet (0-9, a-v only).
 *
 * Curation criteria:
 * - Only characters representable in the encoding alphabet (0-9, a-v)
 * - 3+ characters to avoid excessive false positives
 * - Universally offensive English terms
 */
export const BLOCKED_WORDS: readonly string[] = [
  'anus',
  'ass',
  'ballsac',
  'bitch',
  'blood',
  'bollock',
  'boner',
  'boob',
  'butt',
  'cock',
  'coon',
  'cum',
  'cunt',
  'damn',
  'darki',
  'dick',
  'dildo',
  'douche',
  'fag',
  'felch',
  'fuck',
  'gonad',
  'gook',
  'hell',
  'homo',
  'horni',
  'jism',
  'kike',
  'knob',
  'minge',
  'nig',
  'nob',
  'nonce',
  'nutsac',
  'pedo',
  'penis',
  'piss',
  'poo',
  'poon',
  'porn',
  'prick',
  'pube',
  'puss',
  'queer',
  'rape',
  'scrot',
  'semen',
  'shit',
  'slag',
  'slut',
  'smeg',
  'spic',
  'spunk',
  'tit',
  'trann',
  'turd',
  'vag',
] as const;

/**
 * Lazily compiled regex from the built-in blocklist.
 * Not compiled at module load — only when first used.
 */
let _builtinRegex: RegExp | null = null;

function getBuiltinRegex(): RegExp {
  if (_builtinRegex === null) {
    _builtinRegex = new RegExp(BLOCKED_WORDS.join('|'));
  }
  return _builtinRegex;
}

/**
 * Built-in word filter predicate. Returns true if the string contains
 * an offensive substring from the built-in blocklist.
 */
const defaultWordFilter: WordFilterFn = (encoded) => getBuiltinRegex().test(encoded);

/**
 * Creates a word filter predicate from a custom word list.
 * Words are lowercased and regex-escaped. An empty list returns null
 * (no filtering).
 */
function createWordFilter(words: readonly string[]): WordFilterFn | null {
  if (words.length === 0) return null;
  const escaped = words.map(w => w.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(escaped.join('|'));
  return (encoded) => regex.test(encoded);
}

/**
 * Resolves a `WordFilterOption` into a `WordFilterFn | null`.
 * - `true` → built-in blocklist
 * - `string[]` → custom word list (empty array → null)
 * - `function` → used as-is
 * - `undefined` → null (no filtering)
 */
export function resolveWordFilter(option: WordFilterOption | undefined): WordFilterFn | null {
  if (option === undefined) return null;
  if (option === true) return defaultWordFilter;
  if (typeof option === 'function') return option;
  return createWordFilter(option);
}

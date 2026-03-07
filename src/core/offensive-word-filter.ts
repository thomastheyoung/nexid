/**
 * @module nexid/core/offensive-word-filter
 *
 * Post-generation offensive word filter for XID strings.
 *
 * ARCHITECTURE:
 * This module provides a mechanism to reject generated IDs that contain
 * offensive words as substrings. It ships a curated built-in blocklist
 * and supports extending it with custom terms. Filters are simple predicates
 * that return true when an encoded string should be rejected.
 *
 * The built-in regex is lazily compiled on first use so that applications
 * that do not enable filtering pay zero cost (and bundlers can tree-shake
 * the blocklist away entirely).
 */

/**
 * Predicate that returns true if the encoded string should be rejected.
 */
export type OffensiveWordFilterFn = (encoded: string) => boolean;

/**
 * Built-in blocklist of offensive words (3+ chars) that can be formed
 * from the base32-hex alphabet (0-9, a-v only).
 *
 * Curation criteria:
 * - Only characters representable in the encoding alphabet (0-9, a-v)
 * - 3+ characters to avoid excessive false positives
 * - Universally offensive English terms
 */
export const BLOCKED_WORDS: readonly string[] = Object.freeze([
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
]);

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
 * Built-in offensive word filter predicate. Returns true if the string
 * contains an offensive substring from the built-in blocklist.
 */
const defaultOffensiveWordFilter: OffensiveWordFilterFn = (encoded) =>
  getBuiltinRegex().test(encoded);

/**
 * Creates a combined filter from the built-in blocklist plus additional words.
 * Extra words are lowercased and regex-escaped before compilation.
 */
function createExtendedFilter(extraWords: readonly string[]): OffensiveWordFilterFn {
  const escaped = extraWords
    .filter(w => w.length > 0)
    .map(w => w.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const allWords = [...BLOCKED_WORDS, ...escaped];
  const regex = new RegExp(allWords.join('|'));
  return (encoded) => regex.test(encoded);
}

/**
 * Resolves the offensive word filter configuration into a predicate or null.
 *
 * @param filter - Whether to enable offensive word filtering
 * @param extraWords - Additional words to block alongside the built-in list
 * @returns A filter predicate, or null if filtering is disabled
 */
export function resolveOffensiveWordFilter(
  filter?: boolean,
  extraWords?: readonly string[],
): OffensiveWordFilterFn | null {
  if (filter !== true) return null;
  if (extraWords && extraWords.length > 0) return createExtendedFilter(extraWords);
  return defaultOffensiveWordFilter;
}

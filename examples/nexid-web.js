"use strict";
var NeXID = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/web.ts
  var web_exports = {};
  __export(web_exports, {
    XID: () => XID,
    default: () => web_default,
    init: () => init
  });

  // src/env/lib/hash-function/subtle-crypto.ts
  var hash = async (data) => {
    if (typeof data === "string") {
      const encoder = new TextEncoder();
      data = encoder.encode(data);
    }
    const buffer = await globalThis.crypto.subtle.digest("SHA-256", data);
    return new Uint8Array(buffer);
  };

  // src/env/lib/machine-id/web-fingerprint.ts
  async function getFingerprint() {
    const components = [];
    const salt = (Math.random() * 65535 | 0).toString(16).padStart(2, "0");
    const timestamp = Date.now().toString(36);
    components.push(`salt: ${salt}:${timestamp}`);
    components.push(`env:${detectContext()}`);
    if (exists(navigator)) {
      components.push(`ua:${navigator.userAgent || ""}`);
      components.push(`lang:${navigator.language || ""}`);
      if (navigator.languages && Array.isArray(navigator.languages)) {
        components.push(`langs:${navigator.languages.join(",")}`);
      }
      if ("hardwareConcurrency" in navigator && navigator.hardwareConcurrency) {
        components.push(`cores:${navigator.hardwareConcurrency}`);
      }
      if ("deviceMemory" in navigator && navigator.deviceMemory) {
        components.push(`mem:${navigator.deviceMemory}`);
      }
    }
    if (exists(screen)) {
      components.push(`colorDepth:${screen.colorDepth}`);
      components.push(`width:${screen.width}`);
      components.push(`height:${screen.height}`);
      if (screen.availWidth) {
        components.push(`availWidth:${screen.availWidth}`);
      }
      if (screen.availHeight) {
        components.push(`availHeight:${screen.availHeight}`);
      }
    }
    components.push(`tz:${(/* @__PURE__ */ new Date()).getTimezoneOffset()}`);
    return components.filter(Boolean).join("||");
  }
  function detectContext() {
    if (exists(window) && exists(document)) {
      return "browser";
    }
    if (exists(self) && typeof importScripts === "function") {
      if (isInstance(self, ServiceWorkerGlobalScope)) {
        return "service-worker";
      }
      if (isInstance(self, DedicatedWorkerGlobalScope)) {
        return "dedicated-worker";
      }
      if (isInstance(self, SharedWorkerGlobalScope)) {
        return "shared-worker";
      }
      return "web-worker";
    }
    return "unknown";
  }
  function exists(object) {
    return typeof object !== "undefined";
  }
  function isInstance(object, type) {
    return typeof type !== "undefined" && object instanceof type;
  }

  // src/common/constants.ts
  var ENCODING = "0123456789abcdefghijklmnopqrstuv";
  var ENCODED_LEN = 20;
  var RAW_LEN = 12;
  var BYTE_MASK = 255;
  var PROCESS_ID_MASK = 65535;

  // src/env/lib/process-id/web.ts
  var getProcessId = async () => {
    return Math.random() * PROCESS_ID_MASK;
  };

  // src/env/lib/random-bytes/web-crypto.ts
  var randomBytes = (size) => {
    const bytes = new Uint8Array(size);
    return globalThis.crypto.getRandomValues(bytes);
  };

  // src/core/encoding.ts
  var ENCODING_CHARS = new Uint8Array(Array.from(ENCODING).map((c) => c.charCodeAt(0)));
  var DECODING_TABLE = (() => {
    const table = new Uint8Array(123).fill(255);
    for (let i = 0; i < ENCODING.length; i++) {
      table[ENCODING.charCodeAt(i)] = i;
    }
    return table;
  })();
  var ENCODING_DEST = new Array(ENCODED_LEN);
  function encode(id) {
    const charCodes = ENCODING_DEST;
    const b0 = id[0], b1 = id[1], b2 = id[2], b3 = id[3], b4 = id[4], b5 = id[5], b6 = id[6], b7 = id[7], b8 = id[8], b9 = id[9], b10 = id[10], b11 = id[11];
    charCodes[19] = ENCODING_CHARS[b11 << 4 & 31];
    charCodes[18] = ENCODING_CHARS[b11 >> 1 & 31];
    charCodes[17] = ENCODING_CHARS[(b11 >> 6 | b10 << 2) & 31];
    charCodes[16] = ENCODING_CHARS[b10 >> 3 & 31];
    charCodes[15] = ENCODING_CHARS[b9 & 31];
    charCodes[14] = ENCODING_CHARS[(b9 >> 5 | b8 << 3) & 31];
    charCodes[13] = ENCODING_CHARS[b8 >> 2 & 31];
    charCodes[12] = ENCODING_CHARS[(b8 >> 7 | b7 << 1) & 31];
    charCodes[11] = ENCODING_CHARS[(b7 >> 4 | b6 << 4) & 31];
    charCodes[10] = ENCODING_CHARS[b6 >> 1 & 31];
    charCodes[9] = ENCODING_CHARS[(b6 >> 6 | b5 << 2) & 31];
    charCodes[8] = ENCODING_CHARS[b5 >> 3 & 31];
    charCodes[7] = ENCODING_CHARS[b4 & 31];
    charCodes[6] = ENCODING_CHARS[(b4 >> 5 | b3 << 3) & 31];
    charCodes[5] = ENCODING_CHARS[b3 >> 2 & 31];
    charCodes[4] = ENCODING_CHARS[(b3 >> 7 | b2 << 1) & 31];
    charCodes[3] = ENCODING_CHARS[(b2 >> 4 | b1 << 4) & 31];
    charCodes[2] = ENCODING_CHARS[b1 >> 1 & 31];
    charCodes[1] = ENCODING_CHARS[(b1 >> 6 | b0 << 2) & 31];
    charCodes[0] = ENCODING_CHARS[b0 >> 3 & 31];
    return String.fromCharCode.apply(null, charCodes);
  }
  function decode(str) {
    if (!str || str.length !== ENCODED_LEN) {
      throw new Error(`Invalid XID length: expected ${ENCODED_LEN}, got ${str?.length || 0}`);
    }
    const id = new Uint8Array(RAW_LEN);
    const charCodes = new Uint8Array(ENCODED_LEN);
    for (let i = 0; i < ENCODED_LEN; i++) {
      charCodes[i] = str.charCodeAt(i);
    }
    try {
      const decodedValues = new Uint8Array(ENCODED_LEN);
      for (let i = 0; i < ENCODED_LEN; i++) {
        const charCode = charCodes[i];
        const value = DECODING_TABLE[charCode];
        if (value === 255) {
          throw new Error(`Invalid character '${str[i]}' at position ${i}`);
        }
        decodedValues[i] = value;
      }
      id[0] = decodedValues[0] << 3 | decodedValues[1] >> 2;
      id[1] = decodedValues[1] << 6 | decodedValues[2] << 1 | decodedValues[3] >> 4;
      id[2] = decodedValues[3] << 4 | decodedValues[4] >> 1;
      id[3] = decodedValues[4] << 7 | decodedValues[5] << 2 | decodedValues[6] >> 3;
      id[4] = decodedValues[6] << 5 | decodedValues[7];
      id[5] = decodedValues[8] << 3 | decodedValues[9] >> 2;
      id[6] = decodedValues[9] << 6 | decodedValues[10] << 1 | decodedValues[11] >> 4;
      id[7] = decodedValues[11] << 4 | decodedValues[12] >> 1;
      id[8] = decodedValues[12] << 7 | decodedValues[13] << 2 | decodedValues[14] >> 3;
      id[9] = decodedValues[14] << 5 | decodedValues[15];
      id[10] = decodedValues[16] << 3 | decodedValues[17] >> 2;
      id[11] = decodedValues[17] << 6 | decodedValues[18] << 1 | decodedValues[19] >> 4;
      if (ENCODING[id[11] << 4 & 31] !== str[19]) {
        throw new Error("XID consistency check failed");
      }
      return id;
    } catch (e) {
      if (e instanceof Error && e.message.includes("Invalid character")) {
        throw e;
      }
      if (e instanceof Error && e.message.includes("out of range")) {
        for (let i = 0; i < ENCODED_LEN; i++) {
          const charCode = charCodes[i];
          if (charCode >= DECODING_TABLE.length || DECODING_TABLE[charCode] === 255) {
            throw new Error(`Invalid character '${str[i]}' (code ${charCode}) at position ${i}`);
          }
        }
      }
      throw new Error(`XID decoding error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // src/core/xid.ts
  var XID = class _XID {
    /**
     * Private constructor to ensure XIDs are only created through factory methods.
     * This enforces proper validation of all XID instances.
     *
     * @param bytes - The underlying byte array for the XID
     * @private
     */
    constructor(bytes) {
      this.bytes = bytes;
    }
    // ============================================================================
    // Factory static methods
    // ============================================================================
    /**
     * Creates an XID from a raw byte array.
     *
     * @param bytes - The 12-byte array to create the ID from
     * @returns A new XID instance
     * @throws Error if the input is not a valid 12-byte Uint8Array
     */
    static fromBytes(bytes) {
      if (!(bytes instanceof Uint8Array)) {
        throw new Error("ID is not a Uint8Array");
      }
      if (bytes.length !== RAW_LEN) {
        throw new Error("Invalid id length");
      }
      return new _XID(bytes);
    }
    /**
     * Parses an XID from its 20-character string representation.
     *
     * @param str - The string to parse (expected to be 20 characters in base32-hex format)
     * @returns A new XID instance
     * @throws Error if the input string is invalid or malformed
     */
    static fromString(str) {
      if (str.length !== ENCODED_LEN) {
        throw new Error("Invalid id length");
      }
      if (!/[0-9a-v]{20}/.test(str)) {
        throw new Error("Invalid string id (must be 20 chars, 0-9 a-v");
      }
      return new _XID(decode(str));
    }
    /**
     * Creates a nil (zero) XID, useful as a default value or placeholder.
     *
     * @returns A nil XID (all bytes set to zero)
     */
    static nilID() {
      return new _XID(new Uint8Array(RAW_LEN));
    }
    // ============================================================================
    // Component getters
    // ============================================================================
    /**
     * Extracts the timestamp portion of the XID as a JavaScript Date object.
     *
     * @returns A Date object representing when the ID was created
     */
    get time() {
      const id = this.bytes;
      const seconds = id[0] << 24 | id[1] << 16 | id[2] << 8 | id[3];
      return new Date(seconds * 1e3);
    }
    /**
     * Extracts the machine identifier component from the XID.
     * This is a 3-byte value derived from platform-specific identifiers.
     *
     * @returns A copy of the 3-byte machine ID portion
     */
    get machineId() {
      return this.bytes.slice(4, 7);
    }
    /**
     * Extracts the process ID component from the XID.
     * This is a 2-byte value of the process that generated the ID.
     *
     * @returns A number representing the process ID
     */
    get processId() {
      const id = this.bytes;
      return id[7] << 8 | id[8];
    }
    /**
     * Extracts the counter component from the XID.
     * This is a 3-byte value that increments for each ID generated by the same
     * process, ensuring uniqueness even when multiple IDs are generated in the same second.
     *
     * @returns A number representing the counter value
     */
    get counter() {
      const id = this.bytes;
      return id[9] << 16 | id[10] << 8 | id[11];
    }
    // ============================================================================
    // Instance methods
    // ============================================================================
    /**
     * Converts the XID to its 20-character base32-hex string representation.
     * This string is URL-safe, compact, and maintains lexicographical ordering.
     *
     * @returns A 20-character string representation of the XID
     */
    toString() {
      return encode(this.bytes);
    }
    /**
     * Checks if this XID is a nil (zero) ID.
     * A nil ID has all bytes set to zero and is typically used as a placeholder or default value.
     *
     * @returns True if this is a nil ID, false otherwise
     */
    isNil() {
      return this.bytes.every((byte) => byte === 0);
    }
    /**
     * Checks if this XID is equal to another XID.
     * Two XIDs are equal if they contain the same bytes in the same order.
     *
     * @param other - Second XID to compare
     * @returns True if the XIDs contain identical bytes, false otherwise
     */
    equals(other) {
      if (this === other) return true;
      return this.bytes.every((byte, i) => byte === other.bytes[i]);
    }
  };

  // src/core/counter.ts
  function createAtomicCounter(seed) {
    let buffer;
    if (globalThis.SharedArrayBuffer) {
      buffer = new SharedArrayBuffer(4);
    } else if (globalThis.WebAssembly) {
      buffer = new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true }).buffer;
    } else {
      buffer = new ArrayBuffer(4);
    }
    const counter = new Uint32Array(buffer);
    counter[0] = seed;
    return {
      getNext() {
        const value = Atomics.add(counter, 0, 1);
        if (value === 0) {
          counter[0] = seed & 65535;
        }
        return value & 16777215;
      }
    };
  }

  // src/core/xid-generator.ts
  async function XIDGenerator(env, options = {}) {
    const randomBytes2 = await env.get("RandomBytes", options.randomBytes || null);
    const hashFunction = await env.get("HashFunction");
    const getMachineId = await env.get(
      "MachineId",
      options.machineId ? async () => options.machineId : null
    );
    const machineId = await getMachineId();
    const machineIdBytes = (await hashFunction(machineId)).subarray(0, 3);
    let getProcessId2 = await env.get(
      "ProcessId",
      options.processId ? async () => options.processId : null
    );
    const processId = await getProcessId2() & 65535;
    const baseBuffer = new Uint8Array(RAW_LEN);
    baseBuffer[4] = machineIdBytes[0] & BYTE_MASK;
    baseBuffer[5] = machineIdBytes[1] & BYTE_MASK;
    baseBuffer[6] = machineIdBytes[2] & BYTE_MASK;
    baseBuffer[7] = processId >> 8 & BYTE_MASK;
    baseBuffer[8] = processId & BYTE_MASK;
    const b1 = randomBytes2(3);
    const b2 = randomBytes2(3);
    const b3 = randomBytes2(3);
    const randomSeed = b1[0] << 16 | b2[1] << 8 | b3[2];
    const counter = createAtomicCounter(randomSeed);
    function buildXIDBytes(timestamp) {
      const buffer = new Uint8Array(baseBuffer);
      timestamp = Math.floor(timestamp / 1e3);
      buffer[0] = timestamp >> 24 & BYTE_MASK;
      buffer[1] = timestamp >> 16 & BYTE_MASK;
      buffer[2] = timestamp >> 8 & BYTE_MASK;
      buffer[3] = timestamp & BYTE_MASK;
      const currentCounter = counter.getNext();
      buffer[9] = currentCounter >> 16 & BYTE_MASK;
      buffer[10] = currentCounter >> 8 & BYTE_MASK;
      buffer[11] = currentCounter & BYTE_MASK;
      return buffer;
    }
    return {
      machineId,
      processId,
      /**
       * Generates a new XID with the specified timestamp (defaults to current time).
       *
       * @param datetime - Optional date to use instead of current time
       * @returns A new XID object
       */
      newId(datetime) {
        const timestamp = datetime instanceof Date ? +datetime : Date.now();
        return XID.fromBytes(buildXIDBytes(timestamp));
      },
      /**
       * Generates a new XID string directly, bypassing object creation.
       * This is approximately 30% faster than newId() when only the string
       * representation is needed.
       *
       * @returns A string representation of a new XID
       */
      fastId() {
        return encode(buildXIDBytes(Date.now()));
      }
    };
  }

  // src/env/lib/hash-function/@definition.ts
  var HashFunctionDefinition = {
    /**
     * Tests if the provided implementation is a valid HashFunction function.
     * 
     * @param impl - The implementation to test
     * @returns Promise resolving to true if the implementation is valid
     */
    async test(impl) {
      if (typeof impl !== "function") return false;
      try {
        const result = await impl("custom-hash-test");
        return result instanceof Uint8Array && result.length === 32;
      } catch {
        return false;
      }
    },
    /**
     * Simple fallback hash function when cryptographic APIs are unavailable.
     * Uses FNV-1a (Fowler–Noll–Vo) hash algorithm which is fast and has
     * good distribution properties. While not cryptographically secure,
     * it's sufficient for generating machine IDs.
     *
     * SECURITY NOTE: This hash function is NOT cryptographically secure
     * and should only be used when no secure alternatives are available.
     *
     * @param data - String or byte array to hash
     * @returns A 32-byte hash as a Uint8Array
     */
    async fallback(data) {
      console.warn("Using non-secure fallback (hash)");
      const str = typeof data === "string" ? data : data.toString();
      let h = 2166136261;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = h * 16777619 >>> 0;
      }
      const byteArray = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        byteArray[i] = (h ^ i * 83) + i & 255;
      }
      return byteArray;
    }
  };

  // src/env/lib/machine-id/@definition.ts
  var MachineIdDefinition = {
    /**
     * Tests if the provided implementation is a valid MachineId function.
     * 
     * @param impl - The implementation to test
     * @returns Promise resolving to true if the implementation is valid
     */
    async test(impl) {
      if (typeof impl !== "function") return false;
      try {
        const result = await impl();
        return !!result && typeof result === "string" && result.length > 0;
      } catch {
        return false;
      }
    },
    /**
     * Generates a random machine ID when no hardware identifiers are available.
     * This fallback uses a combination of timestamp and random values to create
     * a reasonably unique identifier that won't collide with other instances.
     *
     * SECURITY NOTE: This implementation is NOT cryptographically secure
     * and should not be used for any security-critical purposes.
     *
     * @returns A Promise that resolves to a machine identifier string
     */
    async fallback() {
      console.warn("Using non-secure fallback (machine id)");
      const timestamp = Date.now().toString(36);
      const random = () => Math.random().toString(36).substring(2, 10);
      return `${random()}-${timestamp}-${random()}`;
    }
  };

  // src/env/lib/process-id/@definition.ts
  var ProcessIdDefinition = {
    /**
     * Tests if the provided implementation is a valid ProcessId function.
     * 
     * @param impl - The implementation to test
     * @returns Promise resolving to true if the implementation is valid
     */
    async test(impl) {
      if (typeof impl !== "function") return false;
      try {
        const result = await impl();
        return typeof result === "number" && result > 0;
      } catch {
        return false;
      }
    },
    /**
     * Generates a random process ID when process information is unavailable.
     * This ensures IDs can still be generated with some level of uniqueness.
     *
     * @returns A Promise that resolves to a randomly generated process ID
     */
    async fallback() {
      console.warn("Using non-secure fallback (process id)");
      return Math.floor(Math.random() * 65535) + 1;
    }
  };

  // src/env/lib/random-bytes/@definition.ts
  var RandomBytesDefinition = {
    /**
     * Tests if the provided implementation is a valid RandomBytes function.
     * 
     * @param impl - The implementation to test
     * @returns Promise resolving to true if the implementation is valid
     */
    async test(impl) {
      if (typeof impl !== "function") return false;
      try {
        const result = impl(5);
        return result instanceof Uint8Array && result.length === 5;
      } catch {
        return false;
      }
    },
    /**
     * Fallback random source that uses Math.random().
     * WARNING: This is NOT cryptographically secure and should only be used
     * when no secure alternatives are available.
     *
     * @param size - Number of random bytes to generate
     * @returns Uint8Array of pseudo-random values
     */
    fallback(size) {
      console.warn("Using non-secure fallback (randomBytes)");
      const byteArray = new Uint8Array(size);
      for (let i = 0; i < size; i++) {
        byteArray[i] = Math.floor(Math.random() * 256);
      }
      return byteArray;
    }
  };

  // src/env/registry.ts
  var REGISTRY = {
    RandomBytes: RandomBytesDefinition,
    HashFunction: HashFunctionDefinition,
    MachineId: MachineIdDefinition,
    ProcessId: ProcessIdDefinition
  };
  var Environment = class {
    constructor(adapter) {
      this.adapter = adapter;
    }
    cache = /* @__PURE__ */ new Map();
    /**
     * Resolves a specific feature implementation, prioritizing:
     * 1. A provided candidate implementation (if valid)
     * 2. Previously cached implementation
     * 3. Adapter-provided implementation
     * 4. Fallback implementation as a last resort
     *
     * @param feature - The capability to resolve
     * @param candidate - Optional custom implementation to use if valid
     * @returns Promise resolving to the best available implementation
     */
    async get(feature, candidate) {
      const featureDefinition = REGISTRY[feature];
      if (candidate && await featureDefinition.test(candidate)) {
        console.log(`NeXID: using user's provided ${feature}: ${candidate}`);
        this.cache.set(feature, candidate);
        return candidate;
      }
      if (this.cache.has(feature)) {
        return this.cache.get(feature);
      }
      const adapterFeature = this.adapter[feature];
      if (await featureDefinition.test(adapterFeature)) {
        console.log(`NeXID: using adapter's implementation of ${feature}`);
        this.cache.set(feature, adapterFeature);
        return adapterFeature;
      }
      console.log(`NeXID: using fallback ${feature}`);
      return featureDefinition.fallback;
    }
  };

  // src/web.ts
  var WebAdapter = new Environment({
    RandomBytes: randomBytes,
    HashFunction: hash,
    MachineId: getFingerprint,
    ProcessId: getProcessId
  });
  async function createXIDGenerator(options) {
    console.log("NeXID: initializing with Web adapter");
    return XIDGenerator(WebAdapter, options);
  }
  var init = createXIDGenerator;
  var web_default = { init: createXIDGenerator };
  return __toCommonJS(web_exports);
})();
//# sourceMappingURL=nexid-web.js.map

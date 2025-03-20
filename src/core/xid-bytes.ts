import { Result } from 'nexid/types/result';
import { RAW_LEN } from './encoding';

// Define nominal type for XID bytes (compiler-enforced uniqueness)
export type XIDBytes = Uint8Array & { readonly __brand: unique symbol };

// Smart constructor pattern - the only way to create an XIDBytes
export function createXIDBytes(bytes: Uint8Array): Result<XIDBytes> {
  if (bytes.length !== RAW_LEN) {
    return Result.Err(`XID must be exactly ${RAW_LEN} bytes`);
  }

  // Additional semantic validation
  if (!isValidXIDStructure(bytes)) {
    return Result.Err('Invalid XID byte structure');
  }

  // Cast to opaque type after validation
  return Result.Ok(bytes as XIDBytes);
}

// Only expose validation function internally
function isValidXIDStructure(bytes: Uint8Array): bytes is XIDBytes {
  if (bytes.length !== RAW_LEN) {
    return false;
  }
  // Validate timestamp is reasonable (not in the future, etc.)
  const timestamp = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
  const now = Math.floor(Date.now() / 1000);

  // Timestamp shouldn't be more than 1 day in future (allowing for clock skew)
  if (timestamp > now + 86400) {
    return false;
  }

  // Other structural validations as needed
  return true;
}

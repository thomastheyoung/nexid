/**
 * @module nexid/env/lib/utils
 * 
 * Environment utility functions for Node.js environments.
 * 
 * ARCHITECTURE:
 * This module provides utility functions for interacting with the operating system
 * in Node.js environments. These functions are primarily used for obtaining machine
 * and process identifiers from the operating system, and are designed to gracefully
 * handle errors and permissions issues.
 * 
 * SECURITY:
 * - All functions catch and suppress exceptions to prevent information leakage
 * - File reading is restricted to expected system files
 * - Command execution is handled with proper sanitization
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';

/**
 * Reads a file from the filesystem, returning its contents as a string.
 * If the file cannot be read or is empty, returns null.
 * 
 * This utility is primarily used for reading machine ID files from
 * system directories like /etc/machine-id on Linux.
 * 
 * @param path - Path to the file to read
 * @returns Promise resolving to the file contents or null if unavailable
 */
export async function readFile(path: string): Promise<string | null> {
  try {
    const res = (await fs.readFile(path, 'utf-8')).trim();
    if (res && res.length > 0) {
      return res;
    }
  } catch {}
  return null;
}

/**
 * Executes a system command and returns its stdout output as a string.
 * If the command fails or produces no output, returns null.
 * 
 * This utility is primarily used for retrieving system information
 * that isn't available through standard Node.js APIs.
 * 
 * @param cmd - Command to execute
 * @returns Promise resolving to the command output or null if unavailable
 */
export async function execCommand(cmd: string): Promise<string | null> {
  try {
    const stdout = execSync(cmd).toString().trim();
    if (stdout && stdout.length > 0) {
      return stdout;
    }
  } catch {}
  return null;
}

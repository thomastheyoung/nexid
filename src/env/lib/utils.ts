import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';

export async function readFile(path: string): Promise<string | null> {
  try {
    const res = (await fs.readFile(path, 'utf-8')).trim();
    if (res && res.length > 0) {
      return res;
    }
  } catch {}
  return null;
}

export async function execCommand(cmd: string): Promise<string | null> {
  try {
    // Use sysctl to get host UUID
    const stdout = execSync(cmd).toString().trim();
    if (stdout && stdout.length > 0) {
      return stdout;
    }
  } catch {}
  return null;
}

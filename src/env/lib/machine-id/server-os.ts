/**
 * @module nexid/env/lib/machine-id/server-os
 * 
 * Operating system machine ID retrieval for server environments.
 * 
 * ARCHITECTURE:
 * This module provides platform-specific implementations for retrieving machine IDs
 * from various operating systems. It uses a combination of system files and commands
 * to identify the machine, with different strategies for each supported OS.
 * 
 * The machine ID is a critical component of the XID structure, ensuring that
 * IDs generated on different machines don't collide even if they have the same
 * timestamp and process ID.
 * 
 * SECURITY:
 * - All retrieved IDs are later hashed before use in XIDs for privacy
 * - Error handling ensures failed ID retrieval doesn't crash the application
 * - Multiple fallback mechanisms ensure some value is always available
 */

import { detectOperatingSystem, OperatingSystem } from '../detect-os';
import { execCommand, readFile } from '../utils';

/**
 * Retrieves a machine identifier from the operating system.
 * Uses different strategies depending on the detected OS:
 * - Linux: /etc/machine-id or product_uuid
 * - macOS: IOPlatformUUID from ioreg
 * - BSD variants: kern.hostuuid sysctl
 * - Windows: MachineGuid from registry
 * 
 * @returns Promise resolving to a machine identifier string or empty string on failure
 */
export const getOSMachineId = async (): Promise<string> => {
  const currentOS = detectOperatingSystem();
  if (!currentOS.isOk()) return '';

  switch (currentOS.unwrap()) {
    case OperatingSystem.FreeBSD:
    case OperatingSystem.NetBSD:
    case OperatingSystem.OpenBSD: {
      return (await execCommand('sysctl -n kern.hostuuid')) || '';
    }

    case OperatingSystem.MacOS: {
      const stdout = await execCommand(
        'ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID'
      );
      // Extract UUID from command output. Typical format is:
      // "IOPlatformUUID" = "85B57EC4-E57F-5645-B158-8D0F49991E49"
      const match = stdout?.match(/IOPlatformUUID\"\s+=\s+\"([^\"]+)\"/);
      if (match && match[1]) {
        return match[1].trim();
      }
      break;
    }

    case OperatingSystem.Linux: {
      const etcMID = await readFile('/etc/machine-id');
      if (etcMID) return etcMID;
      return (await readFile('/sys/class/dmi/id/product_uuid')) || '';
    }

    case OperatingSystem.Windows: {
      const stdout = await execCommand(
        'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid'
      );
      // Extract GUID from reg query output. Typical format is:
      // HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Cryptography
      //     MachineGuid    REG_SZ    8107A438-A7E4-4CEC-A207-2C63A1C0BD14
      const match = stdout?.match(/MachineGuid\s+REG_SZ\s+([^\s]+)/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  }
  return '';
};

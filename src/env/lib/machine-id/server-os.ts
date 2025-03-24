import { detectOperatingSystem, OperatingSystem } from '../detect-os';
import { execCommand, readFile } from '../utils';

export const getOSMachineId = async (): Promise<string> => {
  switch (detectOperatingSystem().unwrap()) {
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

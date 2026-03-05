const BACKGROUND = 'oklch(27.4% 0.006 286.033)';
const TEXT = 'oklch(92.9% 0.013 255.508)';
const ERROR_H = 'oklch(57.7% 0.245 27.325)';
const ERROR_T = 'oklch(70.4% 0.191 22.216)';

const TextColors = {
  cyan: 'oklch(71.5% 0.143 215.221)',
  lime: 'oklch(84.1% 0.238 128.85)',
  amber: 'oklch(82.8% 0.189 84.429)',
  fuchsia: 'oklch(59.1% 0.293 322.896)',
  teal: 'oklch(60% 0.118 184.704)',
  green: 'oklch(62.7% 0.194 149.214)',
  sky: 'oklch(74.6% 0.16 232.661)',
  indigo: 'oklch(51.1% 0.262 276.966)',
  violet: 'oklch(54.1% 0.281 293.009)',
  pink: 'oklch(59.2% 0.249 0.584)',
  blue: 'oklch(62.3% 0.214 259.815)',
  orange: 'oklch(75% 0.183 55.934)',
  emerald: 'oklch(59.6% 0.145 163.225)'
};

export type LoggerVariant = keyof typeof TextColors;

export function Logger(variant: LoggerVariant, prefix: string) {
  return {
    log(...args: any[]) {
      console.log(
        `%c[${prefix}]%c`,
        `background: ${BACKGROUND}; color: ${TextColors[variant]}; font-weight: bold; line-height: 1rem;`,
        `background: ${BACKGROUND}; color: ${TEXT}; line-height: 1rem`,
        ...args
      );
    },
    error(...args: any[]) {
      console.error(
        `%c[${prefix}]%c`,
        `background: ${BACKGROUND}; color: ${ERROR_H}; font-weight: bold; line-height: 1rem;`,
        `background: ${BACKGROUND}; color: ${ERROR_T}; line-height: 1rem`,
        ...args
      );
    }
  };
}

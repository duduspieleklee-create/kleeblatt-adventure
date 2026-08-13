/** Thin logger — DEV-friendly, silent enough for production. */
export const log = {
  debug: (...args: unknown[]) => {
    if (import.meta.env.DEV) console.log(...args);
  },
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};

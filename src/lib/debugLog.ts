// Dev-only console logging. Behaves exactly like console.log in local/dev
// builds (import.meta.env.DEV), but is a no-op in production so visitors
// don't see internal auth/profile state dumped to their browser console.
export const debugLog: (...args: unknown[]) => void = import.meta.env.DEV
  ? console.log.bind(console)
  : () => {};

/** Shared field limits for waitlist form (frontend + API). */
export const WAITLIST_FIELD_LIMITS = {
  name: 80,
  email: 254,
  shopName: 100,
  channelOther: 80,
} as const;

export type WaitlistFieldKey = keyof typeof WAITLIST_FIELD_LIMITS;

/** Minimum time (ms) between page load and submit before a request is treated as human. */
export const WAITLIST_MIN_SUBMIT_MS = 2000;

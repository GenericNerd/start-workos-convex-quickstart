/**
 * Payload WorkOS may attach on thrown `Error` values as `error.rawData`.
 */
export type WorkOsOAuthRawData = Readonly<Record<string, unknown>>

/** If the caught value is an Error with a plain-object `rawData`, returns that object. */
export function workOsOAuthRawDataFromCatch(
  error: unknown
): WorkOsOAuthRawData | undefined {
  if (!(error instanceof Error) || !("rawData" in error)) {
    return undefined
  }
  const raw = (error as Error & { rawData?: unknown }).rawData
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined
  }
  return raw as WorkOsOAuthRawData
}

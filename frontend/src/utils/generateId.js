/**
 * Generates a sequential, prefixed ID (e.g. "P-0001", "PR-0002") based on
 * how many records already exist. Pass the current array length + 1.
 *
 * Usage:
 *   generateId("P", patients.length + 1)   -> "P-0001"
 *   generateId("PR", requests.length + 1)  -> "PR-0002"
 */
export function generateId(prefix, n, padding = 4) {
  return `${prefix}-${String(n).padStart(padding, "0")}`;
}

/**
 * Fallback for when you just need a unique-ish client-side ID
 * (e.g. for a list key before the record is saved to the DB).
 */
export function generateUid(prefix = "ID") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
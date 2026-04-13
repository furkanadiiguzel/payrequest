const E164_RE = /^\+\d{7,15}$/;

/**
 * Accepts a full E.164 string (e.g. "+905321234567") produced by PhoneInput.
 * Returns the value as-is if valid, null otherwise.
 */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  return E164_RE.test(trimmed) ? trimmed : null;
}

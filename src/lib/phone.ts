export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  const normalized =
    digits.length === 11 && digits[0] === '1' ? digits.slice(1) : digits;
  return normalized.length === 10 ? normalized : null;
}

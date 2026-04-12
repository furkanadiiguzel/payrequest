export function centsToDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Builds a service SKU from the name and today's date.
 * Example: "test" on June 25 -> "TES-625" (6 = month, 25 = day).
 */
export function generateKeypadServiceCode(serviceName: string, date = new Date()): string {
  const cleaned = serviceName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const prefix = (cleaned.slice(0, 3) || 'SRV').padEnd(3, 'X');
  const month = date.getMonth() + 1;
  const day = String(date.getDate()).padStart(2, '0');
  return `${prefix}-${month}${day}`;
}

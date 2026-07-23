export function generateGiftCardNumber(): string {
  const timePart = Date.now().toString().slice(-6);
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `GC${timePart}${randomPart}`;
}

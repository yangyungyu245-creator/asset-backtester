export function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export const TEXTS = {
  TITLE_SYNC  : "Heavy animation stutter during Read/Write operations",
  TITLE_ASYNC : "Smooth animations during Read/Write operations",
  OP_LAG_PLH  : "OP: 0 LAG: 0ms",
}

export function rngStr() {
  return Array(16).fill(0).map(() =>
    Math.floor(Math.random() * 36).toString(36)
  ).join('');
}

export function genTestPayload() {
  return Array(200).fill(0).map((_, i) => ({
    id: i,
    value: Math.floor(Math.random() * 1000),
    text: `Item ${i} - ${rngStr()}`,
  }));
}
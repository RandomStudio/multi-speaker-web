export const remap = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) => outMin + ((outMax - outMin) / (inMax - inMin)) * (value - inMin);

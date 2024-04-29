export function isNumber(value: any) {
  return !Number.isNaN(Number(value?.toString()));
}

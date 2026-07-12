export function createSequentialId(prefix: string, currentLength: number): string {
  return `${prefix}-${currentLength + 1}`;
}

export function createNextAssetTag(lastAssetTag: string | undefined): string {
  const lastNumber = lastAssetTag ? Number.parseInt(lastAssetTag.replace('AF-', ''), 10) : 15;
  const nextNumber = Number.isFinite(lastNumber) ? lastNumber + 1 : 16;
  return `AF-${String(nextNumber).padStart(4, '0')}`;
}

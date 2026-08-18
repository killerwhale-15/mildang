export function getItemDisplay(item) {
  const original = item?.original ?? {}
  const adjusted = item?.adjusted
  const effective = item?.effective ?? {}

  return {
    name: adjusted?.label ?? original.name ?? '메뉴',
    unit: adjusted?.label ?? original.unit ?? '',
    points: effective.points ?? 0,
    basis: adjusted?.basis ?? original.basis ?? '',
    confidence: original.confidence,
    balanceAfter: effective.balanceAfter,
    balanceIfOriginal: effective.balanceIfOriginal,
  }
}

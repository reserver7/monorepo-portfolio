export function extractPlaceholders(value) {
  if (typeof value !== "string") return [];
  return [...value.matchAll(/\{([A-Za-z_$][\w$]*)\b/g)].map((match) => match[1]).sort();
}

export function comparePlaceholders(source, target) {
  const sourcePlaceholders = extractPlaceholders(source);
  const targetPlaceholders = extractPlaceholders(target);
  return {
    missing: sourcePlaceholders.filter((name) => !targetPlaceholders.includes(name)),
    extra: targetPlaceholders.filter((name) => !sourcePlaceholders.includes(name))
  };
}

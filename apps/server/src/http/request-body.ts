export type JsonObject = Record<string, unknown>;

export const toJsonObject = (value: unknown): JsonObject => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as JsonObject;
  }

  return {};
};

export const readOptionalString = (body: JsonObject, key: string): string | undefined => {
  const value = body[key];
  if (typeof value !== "string") {
    return undefined;
  }

  return value;
};

export const readStringArray = (body: JsonObject, key: string): string[] => {
  const value = body[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
};

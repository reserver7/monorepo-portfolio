export const addCommasToNumber = (value: number | string | undefined): string => {
  if (
    (typeof value === "number" && !Number.isNaN(value)) ||
    (typeof value === "string" && !Number.isNaN(parseFloat(value)))
  ) {
    const numberValue = typeof value === "string" ? parseFloat(value) : value;
    return numberValue === 0 ? "-" : numberValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  return ""; // For 'undefined' case
};

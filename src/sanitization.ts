import { parsePhoneNumberFromString } from "libphonenumber-js";

export function removeConsecutiveSpaces<T>(value: T): T | string {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(/ +(?= )/g, "");
}

export function removeAllSpaces<T>(value: T): T | string {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(/ /g, "");
}

export function removeDashes<T>(value: T): T | string {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(/-/g, "");
}

export function formatPhoneNumberToE164(value: string): string {
  return parsePhoneNumberFromString(value)?.format("E.164") || value;
}

export function commaSeparatedStringToArray<T>(value: T): T | Array<string> {
  if (typeof value !== "string") {
    return value;
  }

  return value.split(",");
}

export function commaSeparatedStringToIntArray<T>(value: T): T | Array<number> {
  const numbers = commaSeparatedStringToArray<T>(value);
  if (!Array.isArray(numbers)) {
    return value;
  }
  return numbers.map((x: string) => parseInt(x, 10)).filter((x) => !!x);
}
